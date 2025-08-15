<template>
  <div class="pdf-import-container">
    <el-card shadow="hover">
      <div slot="header" class="clearfix">
        <i class="el-icon-upload"></i>
        <span style="margin-left: 8px;">PDF题目导入</span>
        <el-button type="primary" @click="showUploadModal = true" icon="el-icon-plus" style="float: right;">
          上传PDF
        </el-button>
      </div>
      
      <!-- 最近上传统计 -->
      <div v-if="!loading && tasks.length > 0" class="recent-stats" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ total }}</div>
                <div class="stat-label">总任务数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ getStatusCount('processing') }}</div>
                <div class="stat-label">处理中</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ getStatusCount('completed') }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ getStatusCount('failed') }}</div>
                <div class="stat-label">处理失败</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 任务列表 -->
      <el-table
        v-loading="loading"
        :data="tasks"
        style="width: 100%"
        @row-click="handleRowClick">
        <el-table-column
          prop="id"
          label="ID"
          width="80">
        </el-table-column>
        <el-table-column
          prop="filename"
          label="文件名"
          min-width="200">
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.filename" placement="top" :disabled="scope.row.filename.length < 30">
              <span>{{ scope.row.filename | truncate(30) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="120">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="medium">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="progress"
          label="进度"
          width="180">
          <template slot-scope="scope">
            <el-progress 
              :percentage="scope.row.progress" 
              :status="getProgressStatus(scope.row)">
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_time"
          label="上传时间"
          width="180">
          <template slot-scope="scope">
            {{ scope.row.created_time | localtime }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="180">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click.stop="viewDetail(scope.row)"
              :disabled="scope.row.status === 'processing' && scope.row.progress < 100">
              查看详情
            </el-button>
            <el-button
              size="mini"
              type="danger"
              @click.stop="deleteTask(scope.row)"
              :disabled="scope.row.status === 'processing' && scope.row.progress < 100">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" style="margin-top: 20px; text-align: center;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 上传PDF对话框 -->
    <el-dialog
      title="上传PDF文件"
      :visible.sync="showUploadModal"
      width="500px">
      <el-form :model="uploadForm" ref="uploadForm" label-width="100px">
        <el-form-item label="选择文件" prop="file" :rules="[{ required: true, message: '请选择PDF文件', trigger: 'change' }]">
          <el-upload
            class="upload-demo"
            drag
            action=""
            :http-request="handleUpload"
            :before-upload="beforeUpload"
            :file-list="fileList"
            :limit="1"
            :on-exceed="handleExceed"
            :on-remove="handleRemove">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只能上传PDF文件，且不超过20MB</div>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploadModal = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">上传</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/pages/admin/api'
import { UPLOAD_PDF_API } from '@/pages/admin/api'
import { mapGetters } from 'vuex'

export default {
  name: 'PDFImport',
  data() {
    return {
      loading: false,
      tasks: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      showUploadModal: false,
      uploadForm: {
        file: null
      },
      fileList: [],
      uploading: false,
      uploadProgress: 0,
      timer: null
    }
  },
  computed: {
    ...mapGetters(['userInfo'])
  },
  filters: {
    truncate(value, length) {
      if (!value) return ''
      if (value.length <= length) return value
      return value.substring(0, length) + '...'
    }
  },
  created() {
    this.getTasks()
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    getTasks() {
      this.loading = true
      api.getPDFTasks(this.currentPage, this.pageSize).then(res => {
        this.tasks = res.data.data.results
        this.total = res.data.data.total
        this.loading = false
        
        // 如果有处理中的任务，启动轮询
        if (this.tasks.some(task => task.status === 'processing')) {
          this.startPolling()
        }
      }).catch(() => {
        this.loading = false
      })
    },
    startPolling() {
      // 清除可能存在的旧定时器
      if (this.timer) {
        clearInterval(this.timer)
      }
      
      // 设置新的轮询定时器
      this.timer = setInterval(() => {
        // 只有当有处理中的任务时才进行轮询
        if (this.tasks.some(task => task.status === 'processing')) {
          api.getPDFTasks(this.currentPage, this.pageSize).then(res => {
            this.tasks = res.data.data.results
            this.total = res.data.data.total
            
            // 如果没有处理中的任务了，停止轮询
            if (!this.tasks.some(task => task.status === 'processing')) {
              clearInterval(this.timer)
              this.timer = null
            }
          })
        } else {
          // 如果没有处理中的任务，停止轮询
          clearInterval(this.timer)
          this.timer = null
        }
      }, 5000) // 每5秒轮询一次
    },
    getStatusCount(status) {
      return this.tasks.filter(task => task.status === status).length
    },
    getStatusText(status) {
      const statusMap = {
        'processing': '处理中',
        'completed': '已完成',
        'failed': '失败'
      }
      return statusMap[status] || status
    },
    getStatusType(status) {
      const typeMap = {
        'processing': 'warning',
        'completed': 'success',
        'failed': 'danger'
      }
      return typeMap[status] || ''
    },
    getProgressStatus(row) {
      if (row.status === 'failed') return 'exception'
      if (row.status === 'completed') return 'success'
      return ''
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.getTasks()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.getTasks()
    },
    handleRowClick(row) {
      this.viewDetail(row)
    },
    viewDetail(row) {
      if (row.status === 'processing' && row.progress < 100) {
        this.$message.warning('任务正在处理中，请稍后查看详情')
        return
      }
      this.$router.push({
        name: 'pdf_import_detail',
        params: { id: row.id }
      })
    },
    deleteTask(row) {
      if (row.status === 'processing' && row.progress < 100) {
        this.$message.warning('任务正在处理中，无法删除')
        return
      }
      
      this.$confirm('确定要删除该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        api.deletePDFTask(row.id).then(() => {
          this.$message.success('删除成功')
          this.getTasks()
        }).catch(() => {})
      }).catch(() => {})
    },
    beforeUpload(file) {
      const isPDF = file.type === 'application/pdf'
      const isLt20M = file.size / 1024 / 1024 < 20

      if (!isPDF) {
        this.$message.error('只能上传PDF文件!')
        return false
      }
      if (!isLt20M) {
        this.$message.error('文件大小不能超过20MB!')
        return false
      }
      
      this.uploadForm.file = file
      return true
    },
    handleExceed() {
      this.$message.warning('只能上传一个文件')
    },
    handleRemove() {
      this.uploadForm.file = null
      this.fileList = []
    },
    handleUpload(options) {
      // 这里不做实际上传，只是保存文件对象
      this.uploadForm.file = options.file
      this.fileList = [{ name: options.file.name, size: options.file.size }]
    },
    submitUpload() {
      if (!this.uploadForm.file) {
        this.$message.error('请选择要上传的PDF文件')
        return
      }
      
      this.uploading = true
      this.uploadProgress = 0
      
      const formData = new FormData()
      formData.append('file', this.uploadForm.file)
      
      // 使用axios直接上传，以便监控进度
      const xhr = new XMLHttpRequest()
      xhr.open('POST', UPLOAD_PDF_API, true)
      
      // 设置token
      const token = localStorage.getItem('token')
      if (token) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token)
      }
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          this.uploadProgress = Math.round((e.loaded * 100) / e.total)
        }
      }
      
      xhr.onload = () => {
        this.uploading = false
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          this.$message.success('上传成功')
          this.showUploadModal = false
          this.fileList = []
          this.uploadForm.file = null
          this.getTasks()
          
          // 启动轮询以更新任务状态
          this.startPolling()
        } else {
          let errorMsg = '上传失败'
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.msg) {
              errorMsg = response.msg
            }
          } catch (e) {}
          this.$message.error(errorMsg)
        }
      }
      
      xhr.onerror = () => {
        this.uploading = false
        this.$message.error('网络错误，上传失败')
      }
      
      xhr.send(formData)
    }
  }
}
</script>

<style scoped>
.pdf-import-container {
  padding: 20px;
}

.stat-card {
  text-align: center;
  color: #606266;
}

.stat-content {
  padding: 10px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
}

.el-table {
  margin-top: 20px;
}

.el-table .cell {
  word-break: break-word;
}

.upload-demo {
  width: 100%;
}
</style>