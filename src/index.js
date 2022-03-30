console.log('starting...')

require('dotenv').config()
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')
const { sendMail } = require('../libs/nodemailer')
const { createMailContent, usePuppeteer} = require('./utils.js')

puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: true }).then(async browser => {
  console.log('Running crawler...')
  const page = await browser.newPage()
  page.setViewport({ width: 1366, height: 768 })
  const helper = usePuppeteer()
  helper.initPage(page)
  helper.initBrowser(browser)

  await page.goto('https://www.drivingcenter.de/fahrtrainings/fahrtrainings-motorrad/')
  await page.waitForTimeout(2000)
  const allBookingPages = await helper.getAllBookingPages()
  const allPagesWithAppointments = await Promise
    .all(allBookingPages.map(helper.delayLoop(helper.getListOfAppointmentsForBookingPage, 5000)))
  const allPagesWithAvailableAppointments = allPagesWithAppointments.map(page => {
    return page.filter(appointment => appointment.available > 0)
  }).filter(x => x.length)

  try {
    sendMail(createMailContent(allPagesWithAvailableAppointments)).catch(err => console.error(err))
  } catch(err) {
    console.error(err)
  }

  if (!Boolean(process.env.NODEMAILER_SEND_MAILS)) {
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
