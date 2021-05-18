console.log('starting...')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')

puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: true }).then(async browser => {
  console.log('Running crawler...')
  const page = await browser.newPage()
  const helper = usePuppeteer()
  const DELAY_HOMEPAGE = 2000
  const DELAY_TRAINING_PAGE = 5000

  page.setViewport({ width: 1366, height: 768 })
  helper.initPage(page)

  await page.goto('https://www.drivingcenter.de/fahrtrainings/fahrtrainings-motorrad/')
  await page.waitForTimeout(DELAY_HOMEPAGE)
  const allTrainings = await helper.getAllTrainings()
  const allBookingPages = await helper.getAllBookingPages()

  console.log('all Training:', allTrainings)
  console.log('all Booking Pages:', allBookingPages)

  const allPagesWithAppointments = await Promise.all(
    allBookingPages.map(
      helper.delayLoop(
        helper.getListOfAppointmentsForBookingPage,
        DELAY_TRAINING_PAGE
      )
    )
  )

  const allPagesWithAvailableAppointments = allPagesWithAppointments.map(page => {
    return page.filter(appointment => appointment.available > 0)
  }).filter(x => x.length)

  console.log('\n\n------------------- Available Trainings -------------------\n')
  allPagesWithAvailableAppointments.forEach(page => {
    console.log(`\n-------- ${page[0].training} --------\n`)
    page.forEach(appointment => {
      const {
        begin,
        end,
        available,
        price,
        link
      } = appointment
      const _begin = new Date(begin).toDateString()
      const _end = new Date(end).toDateString()
      console.log(`--> Begin: ${_begin} - End: ${_end} - Available: ${available} - ${price} - ${link}`)
    })
  })

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
  };

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

    const parseDate = (trainingDate = '06.06.2021 08:30') => {
      const [_date, time] = trainingDate.split(' ')
      const [day, month, year] = _date.split('.')

      return new Date(Date.parse(`${month}.${day}.${year} ${time}`))
    }

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
    delayLoop
  }
}
