document.addEventListener('drop', (event) => {
  event.preventDefault()
  event.stopPropagation()

  for (const f of event.dataTransfer.files) {
    // Using the path attribute to get absolute file path
    console.log('File Path of dragged files: ', f.path)
    window.electronAPI.addFile(f.path)
  }
})

window.electronAPI.updateFiles((event, value) => {
  $('.files').empty()
  for (const f of value) {
    $('.files').append(
      `<li>${f}<button class="delete" onclick="removeFile('${encodeURI(
        f)}')">X</button></li>`)
  }
  console.log('FileList', value)
})

window.electronAPI.beforeSend((event, e) => {
  $('.current').text(e.currentNumber)
  $('.count').text(e.count)
  // console.log('beforeSend', e)
})

window.electronAPI.afterSend((event, e) => {
  // console.log('afterSend', e)
  $('.info').text('[' + JSON.stringify(e.info) + ']')
  if(e.currentNumber===e.count){
    // $('.current').text('-')
    // $('.count').text('-')
  }
})

// eslint-disable-next-line no-unused-vars
function removeFile(p) {
  p = decodeURI(p)
  console.log('REMOVE', p)
  window.electronAPI.removeFile(p)
}

// eslint-disable-next-line no-unused-vars
function send() {
  window.electronAPI.send($('#subject').val(), $('#email').val())
}

document.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.stopPropagation()
})

window.electronAPI.triggerUpdateFiles()

//
// document.addEventListener('dragenter', (event) => {
//   console.log('File is in the Drop Space');
// })
//
// document.addEventListener('dragleave', (event) => {
//   console.log('File has left the Drop Space');
// })
