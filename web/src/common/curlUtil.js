
export function curlify(recordDetail){
  let curlified = []
  let type = ''
  let headers = { ...recordDetail.reqHeader }
  curlified.push('curl')
  curlified.push('-X', recordDetail.method)
  curlified.push(`'${recordDetail.url}'`)

  if (headers) {
    type = headers['Content-Type']
    delete headers['Accept-Encoding']

    for(let k of Object.keys(headers)){
      let v = headers[k]
      curlified.push('-H')
      curlified.push(`'${k}: ${v}'`)
    }
  }

  if (recordDetail.reqBody){

    if(type === 'multipart/form-data' && recordDetail.method === 'POST') {
      let formDataBody = recordDetail.reqBody.split('&')

      for(let data of formDataBody) {
        curlified.push('-F')
        curlified.push(data)
      }
    } else {
      curlified.push('-d')
      curlified.push(recordDetail.reqBody)
    }
  }

  return curlified.join(' ')
}
