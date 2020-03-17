import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import router from '@/router'
import { UserModule } from '@/store/modules/user'
const notAllowedApi = [
  process.env.VUE_APP_BASE_API + '/user/login',
  process.env.VUE_APP_BASE_API + '/menu/assigned',
  process.env.VUE_APP_BASE_API + '/user/view'
]
/* const fnNotAllowedApi = (url = {
  if()
}) */
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  timeout: 30000
  // withCredentials: true // send cookies when cross-domain requests
})
// Request interceptors
service.interceptors.request.use(
  config => {
    // Add X-Access-Token header to every request, you can add other custom headers here
    return config
  },
  error => {
    Promise.reject(error)
  }
)

// Response interceptors
service.interceptors.response.use(
  response => {
    // console.log(response)
    // 后端返回错误码
    // code === 400004 cookie失效，用户强制推出登录
    // code == 0: success
    if (response.request.responseType === 'blob') {
      return response.data
    } else {
      const res = response.data
      if (res.code !== 0) {
        if (res.code === 300003) {
          if (router.app.$route.path !== '/login') {
            return MessageBox.confirm(
              '你已被登出，可以取消继续留在该页面，或者重新登录',
              '确定登出',
              {
                confirmButtonText: '重新登录',
                cancelButtonText: '取消',
                type: 'warning'
              }
            ).then(() => {
              UserModule.ResetToken()
              location.reload()
            })
          }
        } else if (
          // 只有登录时请求的三个接口遇到300004的时候才组织进入系统，其他应该保留用户已登录状态
          res.code === 300004 &&
          notAllowedApi.includes(response.config.url as string)
        ) {
          return MessageBox.confirm(res.msg, '提示', {
            confirmButtonText: '确定',
            showCancelButton: false,
            type: 'warning'
          }).then(() => {
            UserModule.ResetToken()
            location.reload()
          })
        } else if (res.code === 100012 || res.code === 9) {
          // 伽利略系统状态处理
          return response.data
        } else {
          Message({
            message: res.msg || res.message,
            type: 'error',
            duration: 5 * 1000,
            showClose: true
          })
          return Promise.reject(new Error(res.message || 'Error'))
        }
      } else {
        return response.data
      }
    }
  },
  error => {
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
      showClose: true
    })
    return Promise.reject(error)
  }
)

export default service
