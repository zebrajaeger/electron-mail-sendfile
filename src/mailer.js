let path = require('node:path');
const fs = require('fs');
const EventEmitter = require('events');

const nodemailer = require("nodemailer");
const {v4: uuidv4} = require('uuid');


class Mailer extends EventEmitter{
  maxSize = 8 * 1024 * 1024
  constructor() {
    super();
  }

  send(subject, toEmail, files) {
    const mails = this.preparemails(subject, toEmail, files);
    const credentials = this.getCredentials();
    this.sendMails(credentials, mails, toEmail, false)
    // this.sendMails(credentials, mails, toEmail, true) // DEBUG, don't send Mails
  }

  preparemails(subject, email, files) {
    const mailsToSend = [];
    let mailCount = 1;
    const filesToSend = []
    let currentSize = 0;
    for (const file of files) {
      let stats = fs.statSync(file);
      let size = stats.size;
      if (currentSize + size > this.maxSize) {
        mailsToSend.push({
          attachments: [...filesToSend],
          size: currentSize,
          sizeT: this.formatNumber(currentSize),
          count: mailCount
        })
        mailCount++;
        currentSize = 0;
        filesToSend.length = 0

      }
      filesToSend.push({
        path: file,
        file: path.parse(file).base,
        cid: uuidv4(),
        size,
        sizeT: this.formatNumber(size)
      });
      currentSize += size;
    }

    if (filesToSend.length > 0) {
      mailsToSend.push({
        attachments: [...filesToSend],
        size: currentSize,
        sizeT: this.formatNumber(currentSize),
        count: mailCount
      })
    }

    mailsToSend.forEach(mail => {
      mail.subject = `${subject} (${mail.count}/${mailsToSend.length})`
      let html = '';
      mail.attachments.forEach(attachment => {
        attachment.cid = uuidv4();
        let p = path.parse(attachment.file);
        html += `${p.base}:<br><img src="cid:${attachment.cid}"><br><br>`
      })
      mail.html = html;
    })

    return mailsToSend
  }

  getCredentials() {
    // TODO make it unbuffered
    return require('../credentials.json');
  }

  async sendMails(credentials, mails, mailTo, dryRun) {

    let transporter = nodemailer.createTransport({
      host: credentials.host,
      port: credentials.port,
      secure: true,
      auth: {
        user: credentials.user,
        pass: credentials.pass
      },
    });

    let currentNumber = 1;
    for (let mail of mails) {
      mail.to = mailTo;
      mail.from = credentials.user;
      // console.log('send', mail);
      this.emit('before-send',{mail, currentNumber, count:mails.length})
      if (!dryRun) {
        const info = await transporter.sendMail(mail);
        this.emit('after-send',{mail, info})
        // console.log("Message sent: %s", info.messageId);
      }else{
        this.emit('after-send',{mail, currentNumber, count:mails.length, info: 'dry-run'})
      }
      currentNumber++;
    }
  }

  formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  }
}

module
  .exports = {Mailer}
