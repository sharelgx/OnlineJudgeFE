import Vue from 'vue'
import router from './router'
import axios from 'axios'
import utils from '@/utils/utils'

Vue.prototype.$http = axios
axios.defaults.baseURL = '/api'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.xsrfCookieName = 'csrftoken'

export default {
  // 登录
  login (username, password) {
    return ajax('login', 'post', {
      data: {
        username,
        password
      }
    })
  },
  logout () {
    return ajax('logout', 'get')
  },
  getProfile () {
    return ajax('profile', 'get')
  },
  // 获取公告列表
  getAnnouncementList (offset, limit) {
    return ajax('admin/announcement', 'get', {
      params: {
        paging: true,
        offset,
        limit
      }
    })
  },
  // 删除公告
  deleteAnnouncement (id) {
    return ajax('admin/announcement', 'delete', {
      params: {
        id
      }
    })
  },
  // 修改公告
  updateAnnouncement (data) {
    return ajax('admin/announcement', 'put', {
      data
    })
  },
  // 添加公告
  createAnnouncement (data) {
    return ajax('admin/announcement', 'post', {
      data
    })
  },
  // 获取用户列表
  getUserList (offset, limit, keyword) {
    return ajax('admin/user', 'get', {
      params: {
        paging: true,
        offset,
        limit,
        keyword
      }
    })
  },
  // 获取单个用户信息
  getUser (id) {
    return ajax('admin/user', 'get', {
      params: {
        id
      }
    })
  },
  // 编辑用户
  editUser (data) {
    return ajax('admin/user', 'put', {
      data
    })
  },
  deleteUsers (id) {
    return ajax('admin/user', 'delete', {
      params: {
        id
      }
    })
  },
  importUsers (users) {
    return ajax('admin/user', 'post', {
      data: {
        users
      }
    })
  },
  generateUser (data) {
    return ajax('admin/generate_user', 'post', {
      data
    })
  },
  // 获取问题列表
  getProblemList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/problem', 'get', {
      params
    })
  },
  // 获取单个问题信息
  getProblem (id) {
    return ajax('admin/problem', 'get', {
      params: {
        id
      }
    })
  },
  // 创建问题
  createProblem (data) {
    return ajax('admin/problem', 'post', {
      data
    })
  },
  // 编辑问题
  editProblem (data) {
    return ajax('admin/problem', 'put', {
      data
    })
  },
  // 删除问题
  deleteProblem (id) {
    return ajax('admin/problem', 'delete', {
      params: {
        id
      }
    })
  },
  // 获取测试用例列表
  getTestcaseList (problemID) {
    return ajax('admin/problem/testcase', 'get', {
      params: {
        problem_id: problemID
      }
    })
  },
  // 获取单个测试用例
  getTestcase (id) {
    return ajax('admin/problem/testcase', 'get', {
      params: {
        id
      }
    })
  },
  // 删除测试用例
  deleteTestcase (id) {
    return ajax('admin/problem/testcase', 'delete', {
      params: {
        id
      }
    })
  },
  // 获取竞赛列表
  getContestList (offset, limit, keyword) {
    return ajax('admin/contest', 'get', {
      params: {
        paging: true,
        offset,
        limit,
        keyword
      }
    })
  },
  // 获取单个竞赛信息
  getContest (id) {
    return ajax('admin/contest', 'get', {
      params: {
        id
      }
    })
  },
  // 创建竞赛
  createContest (data) {
    return ajax('admin/contest', 'post', {
      data
    })
  },
  // 编辑竞赛
  editContest (data) {
    return ajax('admin/contest', 'put', {
      data
    })
  },
  // 删除竞赛
  deleteContest (id) {
    return ajax('admin/contest', 'delete', {
      params: {
        id
      }
    })
  },
  // 获取公告列表
  getContestAnnouncementList (contestID) {
    return ajax('admin/contest/announcement', 'get', {
      params: {
        contest_id: contestID
      }
    })
  },
  // 创建公告
  createContestAnnouncement (data) {
    return ajax('admin/contest/announcement', 'post', {
      data
    })
  },
  // 删除公告
  deleteContestAnnouncement (id) {
    return ajax('admin/contest/announcement', 'delete', {
      params: {
        id
      }
    })
  },
  // 更新公告
  updateContestAnnouncement (data) {
    return ajax('admin/contest/announcement', 'put', {
      data
    })
  },
  // 获取竞赛问题列表
  getContestProblemList (params) {
    return ajax('admin/contest/problem', 'get', {
      params
    })
  },
  // 获取竞赛问题详情
  getContestProblem (id) {
    return ajax('admin/contest/problem', 'get', {
      params: {
        id
      }
    })
  },
  // 创建竞赛问题
  createContestProblem (data) {
    return ajax('admin/contest/problem', 'post', {
      data
    })
  },
  // 编辑竞赛问题
  editContestProblem (data) {
    return ajax('admin/contest/problem', 'put', {
      data
    })
  },
  // 删除竞赛问题
  deleteContestProblem (id) {
    return ajax('admin/contest/problem', 'delete', {
      params: {
        id
      }
    })
  },
  // 获取竞赛密码
  getContestPassword (contestID) {
    return ajax('admin/contest/password', 'get', {
      params: {
        contest_id: contestID
      }
    })
  },
  // 设置竞赛密码
  setContestPassword (contestID, password) {
    return ajax('admin/contest/password', 'post', {
      data: {
        contest_id: contestID,
        password
      }
    })
  },
  // 获取系统配置
  getConfig () {
    return ajax('admin/config', 'get')
  },
  // 更新系统配置
  updateConfig (data) {
    return ajax('admin/config', 'put', {
      data
    })
  },
  // 获取判题服务器列表
  getJudgeServer () {
    return ajax('admin/judge_server', 'get')
  },
  // 删除判题服务器
  deleteJudgeServer (hostname) {
    return ajax('admin/judge_server', 'delete', {
      params: {
        hostname: hostname
      }
    })
  },
  // 获取可用的语言列表
  getLanguages () {
    return ajax('languages', 'get')
  },
  // 获取语言模板
  getLanguageTemplate (language) {
    return ajax('admin/problem/template', 'get', {
      params: {
        language
      }
    })
  },
  // 获取提交列表
  getSubmissionList (offset, limit, params) {
    params.limit = limit
    params.offset = offset
    return ajax('admin/submission', 'get', {
      params
    })
  },
  // 获取单个提交信息
  getSubmission (id) {
    return ajax('admin/submission', 'get', {
      params: {
        id
      }
    })
  },
  // 重判提交
  rejudgeSubmission (id) {
    return ajax('admin/submission/rejudge', 'get', {
      params: {
        id
      }
    })
  },
  // 重判全部提交
  rejudgeAllSubmissions (params) {
    return ajax('admin/submission/rejudge-all', 'get', {
      params
    })
  },
  // 下载CSV文件
  exportProblems (format) {
    return ajax('export_problem', 'get', {
      params: {
        format: format
      }
    })
  },
  // Choice Problem APIs
  getChoiceProblemList (params) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/choice_problem', 'get', {
      params
    })
  },
  getChoiceProblem (id) {
    return ajax('admin/choice_problem', 'get', {
      params: {
        id
      }
    })
  },
  createChoiceProblem (data) {
    return ajax('admin/choice_problem', 'post', {
      data
    })
  },
  editChoiceProblem (data) {
    return ajax('admin/choice_problem', 'put', {
      data
    })
  },
  deleteChoiceProblem (id) {
    return ajax('admin/choice_problem', 'delete', {
      params: {
        id
      }
    })
  },
  // Choice Problem Statistics APIs
  getChoiceStatistics () {
    return ajax('admin/choice_problem/statistics', 'get')
  },
  getPopularChoiceProblems () {
    return ajax('admin/choice_problem/popular', 'get')
  },
  getTopChoiceUsers () {
    return ajax('admin/choice_problem/top_users', 'get')
  },
  getChoiceTagStats () {
    return ajax('admin/choice_problem/tag_stats', 'get')
  },
  // Choice Category APIs
  getCategoryList (params = {}) {
    params = utils.filterEmptyValue(params)
    return ajax('admin/choice_category', 'get', {
      params
    })
  },
  getCategory (id) {
    return ajax('admin/choice_category', 'get', {
      params: {
        id
      }
    })
  },
  createCategory (data) {
    return ajax('admin/choice_category', 'post', {
      data
    })
  },
  editCategory (data) {
    return ajax('admin/choice_category', 'put', {
      data
    })
  },
  deleteCategory (id) {
    return ajax('admin/choice_category', 'delete', {
      params: {
        id
      }
    })
  },
  
  // PDF导入相关API
  getPDFImportTasks (params) {
    return ajax('admin/pdf-import/tasks/', 'get', {
      params
    })
  },
  uploadPDF (formData, config = {}) {
    return ajax('admin/pdf-import/upload/', 'post', {
      data: formData,
      ...config
    })
  },
  deletePDFImportTask (id) {
    return ajax('admin/pdf-import/tasks/', 'delete', {
      params: {
        id
      }
    })
  },
  getPDFImportTask (id) {
    return ajax('admin/pdf-import/tasks/', 'get', {
      params: {
        id
      }
    })
  },
  
  // 批量导入选择题
  batchImportChoiceQuestions (data) {
    return ajax('admin/pdf-import/batch-import-questions/', 'post', {
      data
    })
  },
  
  // 单个导入选择题
  importChoiceQuestion (data) {
    return ajax('admin/pdf-import/import-question/', 'post', {
      data
    })
  }
}



/**
 * @param url
 * @param method get|post|put|delete...
 * @param params like queryString. if a url is index?a=1&b=2, params = {a: '1', b: '2'}
 * @param data post data, use for method put|post
 * @returns {Promise}
 */
function ajax (url, method, options) {
  if (options !== undefined) {
    var {params = {}, data = {}, ...axiosConfig} = options
  } else {
    params = data = {}
    axiosConfig = {}
  }
  return new Promise((resolve, reject) => {
    axios({
      url,
      method,
      params,
      data,
      ...axiosConfig
    }).then(res => {
      // API正常返回(status=20x), 是否错误通过有无error判断
      if (res.data.error !== null) {
        Vue.prototype.$error(res.data.data)
        reject(res)
        // // 若后端返回为登录，则为session失效，应退出当前登录用户
        if (res.data.data && res.data.data.startsWith('Please login')) {
          router.push({name: 'login'})
        }
      } else {
        resolve(res)
        if (method !== 'get') {
          Vue.prototype.$success('Succeeded')
        }
      }
    }, res => {
      // API请求异常，一般为Server error 或 network error
      reject(res)
      Vue.prototype.$error(res.data.data)
    })
  })
}