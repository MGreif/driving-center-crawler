console.log('starting...')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')

puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: true }).then(async browser => {
  console.log('running crawler...')
  const { paramIsUsed } = checkForParams()
  const page = await browser.newPage()
  const helper = usePuppeteer()
  const DELAY_HOMEPAGE = 2000
  const DELAY_TRAINING_PAGE = 5000

  helper.initPage(page)
  page.setViewport({ width: 1366, height: 768 })

  await page.goto('https://www.drivingcenter.de/fahrtrainings/fahrtrainings-motorrad/')
  await page.waitForTimeout(DELAY_HOMEPAGE)
  const allTrainings = await helper.getAllTrainings()
  const allBookingPages = await helper.getAllBookingPages()

  if (paramIsUsed('--track-days')) {
    const TRACK_DAY_LINK = await helper.getTrackDayLink()
    allBookingPages.push(TRACK_DAY_LINK)
  }

  console.log('\nall trainings:', allTrainings)
  console.log('\nall booking pages:', allBookingPages)

  const allPagesWithAppointments = await Promise.all(
    allBookingPages.map(
      helper.delayLoop(
        helper.getListOfAppointmentsForBookingPage,
        DELAY_TRAINING_PAGE
      )
    )
  )

  const allPagesWithAvailableAppointments = filterTrainingsForAvailable(allPagesWithAppointments)
  logAllTrainings(allPagesWithAvailableAppointments)

  await browser.close()
})

function usePuppeteer () {
  let page

  const initPage = _page => {
    page = _page
  }

  const getAllTrainings = async () => {
    const selector = '.am-tile-fahrtraining > li > h2'

    return await page.evaluate((sel) => {
      const results = [...document.querySelectorAll(sel)]
      return results.map(item => item.innerText)
    }, selector)
  }

  const getAllBookingPages = async () => {
    const selector = '.am-tile-fahrtraining > li:nth-child(5) > a'

    return await page.evaluate((sel) => {
      const results = [...document.querySelectorAll(sel)]
      return results.map(item => item.href)
    }, selector)
  }

  const getTrackDayLink = async () => {
    const previousPage = await page.evaluate(() => document.location.href)
    const selector = '.am-button-buchen'
    console.log('crawling track-day link...')

    await page.goto('https://www.drivingcenter.de/freies-fahren/freies-fahren-motorrad/')
    await page.waitForTimeout(1000)

    const result = await page.evaluate((sel) => {
      const bookingButton = document.querySelector(sel).href
      return bookingButton
    }, selector)

    await page.goto(previousPage)
    return result
  }

  const getListOfAppointmentsForBookingPage = async (bookingPage) => {
    const currentPage = await page.evaluate(() => document.location.href)
    console.log('\ncurrent page:', currentPage)
    console.log('now crawling page:', bookingPage)

    await page.goto(bookingPage)
    const rows = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('table > tbody > tr')]
      const rowsWithMappedColumns = rows.map(row => {
        return row.querySelectorAll('*')
      })
      return rowsWithMappedColumns.map(row => {
        return Object.values(row).map(column => column.href ? column.href : column.innerText)
      })
    })

    return rows.map(row => {
      if (row.length < 6) {
        return {
          training: `${row[0]} - Gutschein`,
          price: row[1]
        }
      }
      return {
        training: row[0],
        begin: parseDate(row[1]),
        end: parseDate(row[2]),
        location: row[4],
        available: row[5],
        price: row[6],
        link: row[8]
      }
    })
  }

  return {
    initPage,
    getAllTrainings,
    getAllBookingPages,
    getListOfAppointmentsForBookingPage,
    delayLoop,
    getTrackDayLink
  }
}

function logAllTrainings (pagesWithTrainings) {
  console.log('\n\n------------------- Available Trainings -------------------\n')
  pagesWithTrainings.forEach(page => {
    console.log(`\n-------- ${page[0].training} --------\n`)
    page.forEach(training => {
      const {
        begin,
        end,
        available,
        price,
        link
      } = training
      const _begin = new Date(begin).toDateString()
      const _end = new Date(end).toDateString()
      console.log(`- - - > Begin: ${_begin} - End: ${_end} - Available: ${available} - ${price} - ${link}`)
    })
  })
}

function filterTrainingsForAvailable (pagesWithTrainings) {
  return pagesWithTrainings.map(page => {
    return page.filter(appointment => appointment.available > 0)
  }).filter(x => x.length)
}

// This function is used to map through an array of items,
// and execute a function one after another
/*
Example: await Promise.all(numbers.map(delayLoop((num) => num * num, 1000)))
Each second one items of the Array numbers gets squared
*/
function delayLoop (fn, delay) {
  return (name, i) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(fn(name))
      }, i * delay)
    })
  }
}

function parseDate (trainingDate = '01.01.1970 23:59') {
  const [_date, time] = trainingDate.split(' ')
  const [day, month, year] = _date.split('.')

  return new Date(Date.parse(`${month}.${day}.${year} ${time}`))
}

function checkForParams () {
  const args = [...process.argv]
  const nodePath = args.shift()
  const filePath = args.shift()

  const paramIsUsed = (param) => {
    return args.includes(param)
  }

  const getValueOfParam = (param, defaultValue = null) => {
    const indexOfParam = arguments.indexOf(param)
    const value = args[indexOfParam] + 1 || defaultValue
    if (!value) {
      throw Error(`Argument: '${param}' needs a value`)
    }

    return value
  }

  return {
    paramIsUsed,
    getValueOfParam,
    nodePath,
    filePath
  }
}
