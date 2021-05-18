# Driving-Center-Crawler
Crawling all appointments on the drivingcenter page.

---

This crawler crawls all available motorcycle trainings on the [Driving-Center Groß-Dölln](https://www.drivingcenter.de/) website.


# Instructions
- Execute `npm i` to install all dependencies
- Execute `npm start` in root dir
- Thats it!

# Dependencies
- Puppeteer
- Puppeteer-extra
- Puppeteer-extra-plugin-stealth
- XmlSerializer (Gonna be removed soon)
- DOMParser (Gonna be removed soon)

# Whats Coming Next
- Using [nodemailer](https://github.com/nodemailer/nodemailer) to inform the user via email if a training suddenly becomes available
- Storing the data in an Database and analyzing the data
