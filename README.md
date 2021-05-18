# Driving-Center-Crawler
Crawling all appointments on the drivingcenter page.

---

This crawler crawls all available motorcycle trainings on the [Driving-Center Groß-Dölln](https://www.drivingcenter.de/) website.


# Instructions
- Execute `npm i` to install all dependencies
- Execute 
  - `npm start` in root dir
  - `npm start [-- <params>]` in root dir (`-- <param>` adds the parameter `<param>` to the script. `--` before the param is necessary to pass the params through npm start to `node ./src/index.js`) 
- Thats it!

# Options 
- `--track-days` adds the track days to the list of crawling sites

# Dependencies
- Puppeteer
- Puppeteer-extra
- Puppeteer-extra-plugin-stealth
- XmlSerializer (Gonna be removed soon)
- DOMParser (Gonna be removed soon)

# Whats Coming Next
- Using [nodemailer](https://github.com/nodemailer/nodemailer) to inform the user via email if a training suddenly becomes available
- Storing the data in an Database and analyzing the data
