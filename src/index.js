console.log('starting...')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')

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
  const allTrainings = await helper.getAllTrainings()
  const allBookingPages = await helper.getAllBookingPages()

  console.log('all Training:', allTrainings)
  console.log('all Booking Pages:', allBookingPages)

  const allPagesWithAppointments = await Promise.all(allBookingPages.map(helper.delayLoop(helper.getListOfAppointmentsForBookingPage, 5000)))
  console.log(allPagesWithAppointments)

  await browser.close()
})

function usePuppeteer () {
  let page
  let browser

  const initPage = _page => {
    page = _page
  }

  const initBrowser = _browser => {
    browser = _browser
  }

  const getAllTrainings = async () => {
    return await page.evaluate((sel) => {
      const results = [...document.querySelectorAll(sel)]
      return results.map(item => item.innerText)
    }, '.am-tile-fahrtraining > li > h2')
  }

  const getAllBookingPages = async () => {
    return await page.evaluate((sel) => {
      const results = [...document.querySelectorAll(sel)]
      return results.map(item => item.href)
    }, '.am-tile-fahrtraining > li:nth-child(5) > a')
  }

  function delayLoop (fn, delay) {
    return (name, i) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(fn(name))
        }, i * delay)
      })
    }
  };

  const getListOfAppointmentsForBookingPage = async (bookingPage) => {
    const currentPage = await page.evaluate(() => document.location.href)
    console.log('current Page: ', currentPage)
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
      if (row.length === 3) {
        return {
          training: `${row[0]} - Gutschein`,
          price: row[1]
        }
      }
      return {
        training: row[0],
        begin: row[1],
        end: row[2],
        location: row[4],
        available: row[5],
        price: row[6],
        link: row[7]
      }
    })
  }

  return {
    initPage,
    getAllTrainings,
    getAllBookingPages,
    getListOfAppointmentsForBookingPage,
    initBrowser,
    delayLoop
  }
}
