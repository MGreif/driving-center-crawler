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

# Environment variables

> Create .env file at projects root

```
  NODEMAILER_SEND_MAILS     // true | false
  NODEMAILER_HOST           // SMTP Mailserver host
  NODEMAILER_PORT           // SMTP Port
  NODEMAILER_SECURE         // SSL/TLS
  NODEMAILER_USER           // Mail-Sender
  NODEMAILER_PASSWORD       // Mail-Sender's Password
  NODEMAILER_RECIPIENTS     // Mail-Recipients (seperated by comma (, ))

```

# Dependencies
- Puppeteer
- Puppeteer-extra
- Puppeteer-extra-plugin-stealth
- XmlSerializer (Gonna be removed soon)
- DOMParser (Gonna be removed soon)
- Nodemailer
- handlebars
- Dotenv

# Whats Coming Next
- Using [nodemailer](https://github.com/nodemailer/nodemailer) to inform the user via email if a training suddenly becomes available
  - Nodemailer is installed and configured. No updates possible currently. Report is sent to e-mail on premise
- Storing the data in an Database and analyzing the data
