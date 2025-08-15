<template>
  <div class="pdf-import-container">
    <Panel title="PDF导入管理">
      <div slot="header">
        <el-button type="primary" icon="el-icon-upload" @click="showUploadModal = true">上传PDF</el-button>
        <el-button type="success" icon="el-icon-download">导出题库</el-button>
        <el-button type="info" icon="el-icon-data-analysis">分析统计</el-button>
      </div>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="mb-4" v-if="tasks.length > 0">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-number">{{ total }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-number">{{ getStatusCount('processing') }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-number">{{ getStatusCount('completed') }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-number">{{ getStatusCount('failed') }}</div>
              <div class="stat-label">失败</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 空状态 -->
      <div v-if="tasks.length === 0 && !loading" class="empty-state">
        <div class="empty-content">
          <i class="el-icon-document" style="font-size: 48px; color: #909399; margin-bottom: 20px;"></i>
          <h3>暂无PDF导入任务</h3>
          <p>您可以上传PDF文件，系统将自动提取其中的选择题。</p>
          <el-button type="primary" @click="showUploadModal = true" style="margin-top: 20px;">上传PDF</el-button>
        </div>
      </div>
      
      <!-- 任务列表 -->
      <el-table
        v-else
        :data="tasks"
        style="width: 100%"
        :row-class-name="getRowClassName"
        v-loading="loading">
        <el-table-column
          prop="id"
          label="ID"
          width="80">
        </el-table-column>
        
        <el-table-column
          label="文件名"
          min-width="200">
          <template slot-scope="scope">
            <span>{{ getFileName(scope.row.pdf_file) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column
          label="状态"
          width="120"
          slot="status">
          <template slot-scope="scope">
            <div style="display: flex; align-items: center;">
              <i v-if="scope.row.status === 'processing'" class="el-icon-loading" style="margin-right: 5px;"></i>
              <i v-else-if="scope.row.status === 'completed'" class="el-icon-check" style="color: #67C23A; margin-right: 5px;"></i>
              <i v-else-if="scope.row.status === 'failed'" class="el-icon-close" style="color: #F56C6C; margin-right: 5px;"></i>
              <i v-else class="el-icon-time" style="margin-right: 5px;"></i>
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">{{ getStatusText(scope.row.status) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          label="进度"
          width="150"
          slot="progress">
          <template slot-scope="scope">
            <el-progress 
              :percentage="scope.row.progress || 0"
              :status="scope.row.status === 'failed' ? 'exception' : (scope.row.status === 'completed' ? 'success' : '')"
              :stroke-width="15">
            </el-progress>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="total_questions"
          label="题目数量"
          width="100">
        </el-table-column>
        
        <el-table-column
          label="创建时间"
          width="180">
          <template slot-scope="scope">
            <span>{{ formatTime(scope.row.created_at) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column
          label="操作"
          width="150"
          align="center"
          slot="actions">
          <template slot-scope="scope">
            <el-button
              @click="showDetailModal = true; selectedTask = scope.row"
              type="text"
              size="small">
              查看详情
            </el-button>
            <el-button
              @click="deleteTask(scope.row.id)"
              type="text"
              size="small"
              style="color: #F56C6C;">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="page" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          :current-page.sync="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </Panel>
    
    <!-- 上传模态框 -->
    <el-dialog
      title="上传PDF文件"
      :visible.sync="showUploadModal"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="!uploading"
      :show-close="!uploading">
      <div>
        <input
          type="file"
          ref="fileInput"
          accept=".pdf"
          style="display: none;"
          @change="handleFileChange"
        />
        
        <div
          class="upload-drag-area"
          :class="{'drag-over': isDragOver, 'disabled': uploading}"
          @click="triggerFileSelect"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          v-if="!uploadFile">
          <i class="el-icon-upload" style="font-size: 48px; color: #909399; margin-bottom: 10px;"></i>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <div class="el-upload__tip" style="margin-top: 10px;">只能上传PDF文件，且不超过50MB</div>
        </div>
        
        <div v-else>
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <i class="el-icon-document-checked" style="font-size: 36px; color: #409EFF; margin-right: 15px;"></i>
            <div style="flex: 1;">
              <div style="font-weight: bold; margin-bottom: 5px;">{{ uploadFile.name }}</div>
              <div style="color: #909399; font-size: 12px;">{{ formatFileSize(uploadFile.size) }}</div>
            </div>
            <el-button 
              v-if="!uploading"
              type="danger" 
              icon="el-icon-delete" 
              size="mini" 
              circle
              @click="uploadFile = null">
            </el-button>
          </div>
          
          <el-progress 
            v-if="uploading"
            :percentage="uploadProgress"
            :status="uploadProgress === 100 ? 'success' : ''"
            :stroke-width="18">
          </el-progress>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploadModal = false; resetUpload()" :disabled="uploading">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading" :disabled="!uploadFile">上传</el-button>
      </span>
    </el-dialog>
    
    <!-- 详情模态框 -->
    <el-dialog
      title="PDF导入详情"
      :visible.sync="showDetailModal"
      width="80%"
      :close-on-click-modal="false"
      :fullscreen="false"
      v-if="selectedTask">
      <div>
        <!-- 基本信息 -->
        <el-card class="box-card" shadow="never" style="margin-bottom: 20px;">
          <div slot="header">
            <span>基本信息</span>
          </div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="文件名">{{ getFileName(selectedTask.pdf_file) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(selectedTask.status)">{{ getStatusText(selectedTask.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="进度">
              <el-progress 
                :percentage="selectedTask.progress || 0"
                :status="selectedTask.status === 'failed' ? 'exception' : (selectedTask.status === 'completed' ? 'success' : '')"
                :stroke-width="15">
              </el-progress>
            </el-descriptions-item>
            <el-descriptions-item label="题目数量">{{ selectedTask.total_questions || 0 }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(selectedTask.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(selectedTask.updated_at) }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 错误信息 -->
          <div v-if="selectedTask.error_message" style="margin-top: 15px;">
            <el-alert
              title="处理错误"
              type="error"
              :description="selectedTask.error_message"
              show-icon>
            </el-alert>
          </div>
        </el-card>
        
        <!-- 解析出的题目 -->
        <div v-if="selectedTask.parsed_questions && selectedTask.parsed_questions.length > 0">
          <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <el-checkbox 
                v-model="selectAll" 
                :indeterminate="isIndeterminate"
                @change="handleSelectAll">
                全选
              </el-checkbox>
              <span style="margin-left: 15px;">
                已选择 <span style="color: #409EFF; font-weight: bold;">{{ selectedQuestions.length }}</span> 道题目
              </span>
            </div>
            <el-button 
              type="primary" 
              :disabled="selectedQuestions.length === 0"
              @click="importSelectedQuestions">
              导入选中题目
            </el-button>
          </div>
          
          <el-card 
            v-for="(question, index) in selectedTask.parsed_questions" 
            :key="index"
            class="box-card question-card"
            style="margin-bottom: 15px;">
            <div style="display: flex; align-items: flex-start;">
              <el-checkbox 
                v-model="selectedQuestions" 
                :label="index"
                style="margin-right: 15px; margin-top: 3px;">
              </el-checkbox>
              
              <div style="flex: 1;">
                <!-- 题目内容 -->
                <div class="question-content">
                  <div v-for="(content, cIndex) in question.question_content" :key="'content-' + cIndex">
                    <div v-if="content.type === 'text'" style="margin-bottom: 10px;">
                      {{ content.content }}
                    </div>
                    <div v-else-if="content.type === 'image'" style="margin-bottom: 10px;">
                      <el-image 
                        :src="content.content" 
                        :preview-src-list="[content.content]"
                        style="max-width: 100%; max-height: 300px;">
                      </el-image>
                    </div>
                  </div>
                </div>
                
                <!-- 选项 -->
                <div class="question-options" style="margin-top: 15px;">
                  <div 
                    v-for="(option, oIndex) in question.options" 
                    :key="'option-' + oIndex"
                    style="margin-bottom: 8px;">
                    <div style="display: flex; align-items: flex-start;">
                      <div style="min-width: 25px; font-weight: bold;">
                        {{ String.fromCharCode(65 + oIndex) }}.
                      </div>
                      <div>
                        {{ option }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 答案 -->
                <div style="margin-top: 15px; color: #67C23A; font-weight: bold;">
                  正确答案: {{ question.answer }}
                </div>
              </div>
              
              <div style="margin-left: 15px;">
                <el-button 
                  type="primary" 
                  size="small"
                  icon="el-icon-edit"
                  circle
                  @click="editQuestion(index)">
                </el-button>
                <el-button 
                  type="success" 
                  size="small"
                  icon="el-icon-check"
                  circle
                  @click="importSingleQuestion(index)">
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
        
        <div v-else-if="selectedTask.status === 'completed'" style="text-align: center; padding: 40px 0;">
          <i class="el-icon-warning-outline" style="font-size: 48px; color: #E6A23C; margin-bottom: 20px;"></i>
          <h3>未解析出题目</h3>
          <p>系统未能从PDF中解析出选择题，请检查PDF内容格式是否正确。</p>
        </div>
        
        <div v-else-if="selectedTask.status === 'processing'" style="text-align: center; padding: 40px 0;">
          <i class="el-icon-loading" style="font-size: 48px; color: #409EFF; margin-bottom: 20px;"></i>
          <h3>正在处理中</h3>
          <p>系统正在解析PDF中的选择题，请稍后查看。</p>
        </div>
      </div>
    </el-dialog>
    
    <!-- 编辑题目模态框 -->
    <el-dialog
      title="编辑题目"
      :visible.sync="showEditModal"
      width="60%"
      :close-on-click-modal="false"
      v-if="editingQuestion">
      <div>
        <!-- 题目内容 -->
        <el-form label-position="top">
          <el-form-item label="题目内容">
            <el-input 
              type="textarea" 
              :rows="4" 
              v-model="editingQuestion.question_content[0].content"
              placeholder="请输入题目内容">
            </el-input>
          </el-form-item>
          
          <!-- 选项 -->
          <el-form-item 
            v-for="(option, index) in editingQuestion.options" 
            :key="'edit-option-' + index"
            :label="'选项 ' + String.fromCharCode(65 + index)">
            <el-input v-model="editingQuestion.options[index]" placeholder="请输入选项内容"></el-input>
          </el-form-item>
          
          <!-- 正确答案 -->
          <el-form-item label="正确答案">
            <el-select v-model="editingQuestion.answer" placeholder="请选择正确答案">
              <el-option
                v-for="(_, index) in editingQuestion.options"
                :key="index"
                :label="String.fromCharCode(65 + index)"
                :value="String.fromCharCode(65 + index)">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditModal = false">取消</el-button>
        <el-button type="primary" @click="saveEditedQuestion">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '@/api'
import Panel from '@/components/panel.vue'

export default {
  name: 'PDFImport',
  components: {
    Panel
  },
  data () {
    return {
      loading: false,
      showUploadModal: false,
      showDetailModal: false,
      uploadFile: null,
      uploading: false,
      uploadProgress: 0,
      isDragOver: false,
      selectedTask: null,
      tasks: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      newTaskId: null, // 用于高亮显示新上传的任务
      selectedQuestions: [], // 选中的题目索引
      selectAll: false, // 全选状态
      showEditModal: false, // 编辑题目模态框
      editingQuestion: null, // 正在编辑的题目
      editingIndex: -1, // 正在编辑的题目索引
      columns: [
        {
          title: '文件名',
          key: 'pdf_file',
          render: (h, params) => {
            return h('span', this.getFileName(params.row.pdf_file))
          }
        },
        {
          title: '状态',
          slot: 'status',
          width: 120
        },
        {
          title: '进度',
          slot: 'progress',
          width: 150
        },
        {
          title: '题目数量',
          key: 'total_questions',
          width: 100
        },
        {
          title: '创建时间',
          key: 'created_at',
          width: 180,
          render: (h, params) => {
            return h('span', this.formatTime(params.row.created_at))
          }
        },
        {
          title: '操作',
          slot: 'actions',
          width: 150,
          align: 'center'
        }
      ]
    }
  },
  computed: {
    uploadHeaders () {
      // 使用session认证，Django会自动处理CSRF token
      return {
        'X-CSRFToken': this.getCsrfToken()
      }
    },
    isIndeterminate () {
      const selectedCount = this.selectedQuestions.length
      const totalCount = this.selectedTask && this.selectedTask.parsed_questions ? this.selectedTask.parsed_questions.length : 0
      return selectedCount > 0 && selectedCount < totalCount
    }
  },
  mounted () {
    this.getTasks()
    // 定时刷新任务状态
    this.timer = setInterval(() => {
      this.getTasks()
    }, 5000)
  },
  beforeDestroy () {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },
  methods: {
    async getTasks () {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        }
        const res = await api.getPDFImportTasks(params)
        this.tasks = res.data.data.results
        this.total = res.data.data.count
      } catch (err) {
        this.$error('获取任务列表失败')
      } finally {
        this.loading = false
      }
    },
    
    triggerFileSelect () {
      if (!this.uploading) {
        this.$refs.fileInput.click()
      }
    },
    
    handleFileChange (event) {
      const file = event.target.files[0]
      if (file) {
        this.validateAndSetFile(file)
      }
    },
    
    handleDragOver (event) {
      this.isDragOver = true
    },
    
    handleDragLeave (event) {
      this.isDragOver = false
    },
    
    handleDrop (event) {
      this.isDragOver = false
      if (!this.uploading) {
        const files = event.dataTransfer.files
        if (files.length > 0) {
          this.validateAndSetFile(files[0])
        }
      }
    },
    
    validateAndSetFile (file) {
      const isPDF = file.type === 'application/pdf'
      const isLt50M = file.size / 1024 / 1024 < 50
      
      if (!isPDF) {
        this.$error('只能上传PDF格式的文件!')
        return false
      }
      if (!isLt50M) {
        this.$error('文件大小不能超过50MB!')
        return false
      }
      
      this.uploadFile = file
      this.$success(`已选择文件: ${file.name}`)
      return true
    },
    
    async handleUpload () {
      if (!this.uploadFile) {
        this.$error('请选择要上传的PDF文件')
        return
      }
      
      this.uploading = true
      this.uploadProgress = 0
      
      const formData = new FormData()
      formData.append('pdf_file', this.uploadFile)
      
      try {
        // 使用真实的上传进度
        const response = await api.uploadPDF(formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            }
          }
        })
        
        // 完成上传进度
        this.uploadProgress = 100
        
        // 显示详细的上传结果
        this.$notify({
          title: '上传成功',
          message: `文件 "${this.uploadFile.name}" 上传成功！系统正在后台处理，请稍后查看任务列表。`,
          type: 'success',
          duration: 5000,
          position: 'top-right'
        })
        
        // 如果响应包含任务信息，显示任务ID并标记为新任务
        if (response && response.data && response.data.task_id) {
          this.newTaskId = response.data.task_id
          this.$message({
            message: `任务ID: ${response.data.task_id}，您可以在任务列表中跟踪处理进度`,
            type: 'info',
            duration: 8000,
            showClose: true
          })
          
          // 3秒后移除高亮
          setTimeout(() => {
            this.newTaskId = null
          }, 3000)
        }
        
        this.showUploadModal = false
        this.resetUpload()
        
        // 立即刷新任务列表以显示新任务
        await this.getTasks()
        
        // 如果有新任务，滚动到顶部显示
        this.$nextTick(() => {
          const tableElement = this.$el.querySelector('.el-table__body-wrapper')
          if (tableElement) {
            tableElement.scrollTop = 0
          }
        })
        
      } catch (err) {
        console.error('PDF上传失败:', err)
        
        let errorMessage = 'PDF上传失败'
        if (err.response && err.response.data) {
          if (err.response.data.error) {
            errorMessage = err.response.data.error
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message
          }
        }
        
        this.$notify({
          title: '上传失败',
          message: `文件 "${this.uploadFile.name}" 上传失败：${errorMessage}`,
          type: 'error',
          duration: 8000,
          position: 'top-right'
        })
        
      } finally {
        this.uploading = false
      }
    },
    
    resetUpload () {
      this.uploadFile = null
      this.uploading = false
      this.uploadProgress = 0
    },
    
    onUploadSuccess () {
      // 处理成功回调
    },
    
    onUploadError () {
      this.$error('上传失败')
    },
    
    viewDetails (task) {
      // 跳转到详情页面
      this.$router.push({
        name: 'pdf-import-detail',
        params: { id: task.id }
      })
    },
    
    handleSelectAll (val) {
      if (val) {
        this.selectedQuestions = this.selectedTask.parsed_questions.map((_, index) => index)
      } else {
        this.selectedQuestions = []
      }
    },
    
    async importSelectedQuestions () {
      if (this.selectedQuestions.length === 0) {
        this.$message.warning('请先选择要导入的题目')
        return
      }
      
      try {
        const questionsToImport = this.selectedQuestions.map(index => {
          const question = this.selectedTask.parsed_questions[index]
          return {
            title: this.extractQuestionTitle(question.question_content),
            content: question.question_content,
            options: question.options,
            answer: question.answer,
            difficulty: 'Low', // 默认难度
            tags: [] // 默认标签
          }
        })
        
        await api.batchImportChoiceQuestions({
          questions: questionsToImport,
          task_id: this.selectedTask.id
        })
        
        this.$success(`成功导入 ${this.selectedQuestions.length} 道题目`)
        this.selectedQuestions = []
        this.selectAll = false
        this.showDetailModal = false
      } catch (err) {
         const errorMessage = err.response && err.response.data && err.response.data.error ? err.response.data.error : err.message
         this.$error('导入失败：' + errorMessage)
       }
    },
    
    async importSingleQuestion (index) {
      try {
        const question = this.selectedTask.parsed_questions[index]
        const questionToImport = {
          title: this.extractQuestionTitle(question.question_content),
          content: question.question_content,
          options: question.options,
          answer: question.answer,
          difficulty: 'Low',
          tags: []
        }
        
        await api.importChoiceQuestion({
          question: questionToImport,
          task_id: this.selectedTask.id,
          source_question_index: index
        })
        
        this.$success('题目导入成功')
      } catch (err) {
        const errorMessage = err.response && err.response.data && err.response.data.error ? err.response.data.error : err.message
        this.$error('导入失败：' + errorMessage)
      }
    },
    
    editQuestion (index) {
      this.editingIndex = index
      this.editingQuestion = JSON.parse(JSON.stringify(this.selectedTask.parsed_questions[index]))
      this.showEditModal = true
    },
    
    extractQuestionTitle (questionContent) {
        // 从题目内容中提取标题，取前50个字符作为标题
        if (!questionContent || !Array.isArray(questionContent)) {
          return '无标题'
        }
        const textContent = questionContent
          .filter(content => content && content.type === 'text')
          .map(content => content.content || '')
          .join(' ')
        return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent || '无标题'
      },
      
      saveEditedQuestion () {
        // 更新原始数据
        this.$set(this.selectedTask.parsed_questions, this.editingIndex, this.editingQuestion)
        this.showEditModal = false
        this.$success('题目修改成功')
      },
     
     async deleteTask (taskId) {
      try {
        await this.$confirm('确定要删除这个PDF导入任务吗？此操作不可恢复。', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await api.deletePDFImportTask(taskId)
        this.$success('删除成功')
        this.getTasks()
      } catch (err) {
        if (err !== 'cancel') {
          this.$error('删除失败')
        }
      }
    },
    
    handlePageChange (page) {
      this.currentPage = page
      this.getTasks()
    },
    
    handleSizeChange (size) {
      this.pageSize = size
      this.currentPage = 1
      this.getTasks()
    },
    
    getStatusCount (status) {
      return this.tasks.filter(task => task.status === status).length
    },
    
    isRecentUpload (createdAt) {
      const now = new Date()
      const uploadTime = new Date(createdAt)
      const diffInHours = (now - uploadTime) / (1000 * 60 * 60)
      return diffInHours <= 24 // 24小时内算作最近上传
    },
    
    getStatusColor (status) {
      const colors = {
        'pending': 'default',
        'processing': 'blue',
        'completed': 'green',
        'failed': 'red'
      }
      return colors[status] || 'default'
    },
    
    getStatusTagType (status) {
      const types = {
        'pending': 'info',
        'processing': 'primary',
        'completed': 'success',
        'failed': 'danger'
      }
      return types[status] || 'info'
    },
    
    getStatusText (status) {
      const texts = {
        'pending': '等待处理',
        'processing': '处理中',
        'completed': '已完成',
        'failed': '处理失败'
      }
      return texts[status] || status
    },
    
    getFileName (filePath) {
      if (!filePath) return '-'
      try {
        return decodeURIComponent(filePath.split('/').pop())
      } catch (e) {
        return filePath.split('/').pop()
      }
    },
    
    formatTime (timeStr) {
      if (!timeStr) return '-'
      return new Date(timeStr).toLocaleString('zh-CN')
    },
    
    getRowClassName ({ row, rowIndex }) {
      // 高亮显示新上传的任务
      if (this.newTaskId && row.id === this.newTaskId) {
        return 'new-task-row'
      }
      return ''
    },
    
    formatFileSize (bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    getCsrfToken () {
      // 从cookie中获取CSRF token
      const name = 'csrftoken'
      let cookieValue = null
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim()
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
            break
          }
        }
      }
      return cookieValue
    }
  }
}
</script>

<style scoped>
.pdf-import-container {
  padding: 20px;
}

/* 统计卡片样式 */
.stat-card {
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

/* 新任务高亮样式 */
.el-table .new-task-row {
  background-color: #f0f9ff !important;
  animation: highlight-fade 3s ease-out;
}

.el-table .new-task-row:hover {
  background-color: #e6f7ff !important;
}

@keyframes highlight-fade {
  0% {
    background-color: #bae7ff !important;
    transform: scale(1.01);
  }
  100% {
    background-color: #f0f9ff !important;
    transform: scale(1);
  }
}

.upload-drag-area {
  border: 2px dashed #d7dde4;
  border-radius: 6px;
  background: #fafafa;
  text-align: center;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-drag-area:hover,
.upload-drag-area.drag-over {
  border-color: #2d8cf0;
  background: #f0f9ff;
  transform: scale(1.02);
}

.upload-drag-area.disabled {
  border-color: #dcdfe6;
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
  transform: none;
}

.upload-drag-area.disabled:hover {
  border-color: #dcdfe6;
  background: #f5f7fa;
  transform: none;
}

.upload-area {
  border: 2px dashed #d7dde4;
  border-radius: 6px;
  background: #fafafa;
  text-align: center;
  padding: 40px 0;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #2d8cf0;
}

.upload-area.dragover {
  border-color: #2d8cf0;
  background: #f0f9ff;
}
</style>