const fs = require('fs')
const handlebars = require('handlebars')

function createMailContent(data = []) {
  const html = fs.readFileSync(__dirname + '/../templates/email.hbs','utf8').toString();
  const template = handlebars.compile(html)
  return template(data.filter(data => data.find(appointment => appointment.training)))
}

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
        begin: new Date(parseDate(row[1])).toDateString(),
        end: new Date(parseDate(row[2])).toDateString(),
        location: row[4],
        available: row[5],
        price: row[6],
        link: row[8]
      }
    })
  }
  const getTrackDayLink = async () => {
    const previousPage = await page.evaluate(() => document.location.href)
    const selector = '.am-button-buchen'
    console.log('crawling track-day link')

    await page.goto('https://www.drivingcenter.de/freies-fahren/freies-fahren-motorrad/')
    await page.waitForTimeout(1000)

    const result = await page.evaluate((sel) => {
      const bookingButton = document.querySelector(sel).href
      return bookingButton
    }, selector)

    await page.goto(previousPage)
    return result
  }

  return {
    initPage,
    getAllTrainings,
    getAllBookingPages,
    getListOfAppointmentsForBookingPage,
    initBrowser,
    delayLoop,
    getTrackDayLink
  }
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

module.exports = { usePuppeteer, createMailContent, checkForParams }