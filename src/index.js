console.log('starting...')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const puppeteer = require('puppeteer-extra')

puppeteer.use(StealthPlugin())

puppeteer.launch({ headless: true }).then(async browser => {
  console.log('Running crawler...')
  const page = await browser.newPage()
  const helper = usePuppeteer()
  helper.initPage(page)

  await page.goto('https://www.drivingcenter.de/fahrtrainings/fahrtrainings-motorrad/')
  await page.waitForTimeout(5000)
  const allTrainings = helper.getDataFromSelector('.am-tile-fahrtraining > li > h2')
  console.log(allTrainings)
  await browser.close()
})

function usePuppeteer () {
  let page

  const initPage = _page => {
    page = _page
  }

  const getDataFromSelector = async (selector) => {
    return await page.evaluate(async (selector) => {
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve(Array.from(document.querySelectorAll(selector)))
        }, 1000)
      })
    })
  }

  return {
    initPage,
    getDataFromSelector
  }
}
