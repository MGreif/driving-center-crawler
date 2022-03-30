console.log('starting...')

require('dotenv').config()
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const { sendMail } = require('../libs/nodemailer')
const { createMailContent, usePuppeteer, checkForParams} = require('./utils.js')

puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: true }).then(async browser => {
  console.log('Running crawler...')
  const page = await browser.newPage()
  const helper = usePuppeteer()
  const { paramIsUsed } = checkForParams()
  page.setViewport({ width: 1366, height: 768 })
  helper.initPage(page)
  helper.initBrowser(browser)
  
  const TRACK_DAY_LINK = await helper.getTrackDayLink()
  await page.goto('https://www.drivingcenter.de/fahrtrainings/fahrtrainings-motorrad/')
  await page.waitForTimeout(2000)
  const allBookingPages = await helper.getAllBookingPages()

  if (paramIsUsed('--track-days')) {
    console.log(TRACK_DAY_LINK)
    allBookingPages.push(TRACK_DAY_LINK)
  }

  const allPagesWithAppointments = await Promise
    .all(allBookingPages.map(helper.delayLoop(helper.getListOfAppointmentsForBookingPage, 5000)))
  const allPagesWithAvailableAppointments = allPagesWithAppointments.map(page => {
    return page.filter(appointment => appointment.available > 0)
  }).filter(x => x.length)
  console.log(allPagesWithAvailableAppointments)
  try {
    sendMail(createMailContent(allPagesWithAvailableAppointments)).catch(err => console.error(err))
  } catch(err) {
    console.error(err)
  }

  if (process.env.NODEMAILER_SEND_MAILS === false) {
    console.log('------------------- Available Trainings -------------------\n')
    console.log(allPagesWithAvailableAppointments.forEach(page => {
      console.log(`\n-------- ${page[0].training} --------\n`)
      page.forEach(appointment => {
        const {
          begin,
          end,
          available,
          price,
          link
        } = appointment
        console.log(`--> Begin: ${begin} - End: ${end} - Available: ${available} - ${price} - ${link}`)
      })
    }))
  }
  await browser.close()
})
