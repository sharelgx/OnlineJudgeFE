<template>
  <div class="pdf-import-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="text" 
          icon="el-icon-arrow-left" 
          @click="goBack"
          class="back-button"
        >
          返回
        </el-button>
        <h2>PDF导入任务详情</h2>
      </div>
    </div>

    <!-- 任务详情内容 -->
    <div class="detail-content" v-if="taskDetail">
      <!-- 基本信息卡片 -->
      <el-card class="info-card" shadow="never">
        <div slot="header">
          <span class="card-title">基本信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <span class="label">文件名:</span>
              <span class="value">{{ getFileName(taskDetail.pdf_file) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">状态:</span>
              <el-tag :type="getStatusTagType(taskDetail.status)">{{ getStatusText(taskDetail.status) }}</el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">进度:</span>
              <span class="value">{{ taskDetail.progress }}%</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">题目数量:</span>
              <span class="value">{{ taskDetail.total_questions }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatTime(taskDetail.created_at) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatTime(taskDetail.updated_at) }}</span>
            </div>
          </el-col>
        </el-row>
        
        <!-- 错误信息 -->
        <div v-if="taskDetail.error_message" style="margin-top: 20px;">
          <el-alert
            title="错误信息"
            type="error"
            show-icon
            :closable="false">
            <div slot="description">{{ taskDetail.error_message }}</div>
          </el-alert>
        </div>
      </el-card>

      <!-- 题目列表卡片 -->
      <el-card class="questions-card" shadow="never" v-if="taskDetail.parsed_questions && taskDetail.parsed_questions.length > 0">
        <div slot="header" class="questions-header">
          <span class="card-title">解析的题目 ({{ taskDetail.parsed_questions.length }})</span>
          <div class="header-actions">
            <el-checkbox 
              v-model="selectAll" 
              @change="handleSelectAll"
              :indeterminate="isIndeterminate"
              style="margin-right: 15px;"
            >
              全选
            </el-checkbox>
            <el-button 
              type="primary" 
              size="small" 
              @click="importSelectedQuestions"
              :disabled="selectedQuestions.length === 0"
            >
              导入选中题目 ({{ selectedQuestions.length }})
            </el-button>
          </div>
        </div>
        
        <!-- 题目列表 -->
        <div class="questions-list">
          <div 
            v-for="(question, index) in taskDetail.parsed_questions" 
            :key="index" 
            class="question-item"
          >
            <div class="question-content">
              <div class="question-header">
                <el-checkbox 
                  v-model="selectedQuestions" 
                  :label="index"
                  style="margin-right: 10px;"
                ></el-checkbox>
                <strong>题目 {{ index + 1 }}:</strong>
              </div>
              
              <div class="question-text">
                <div v-for="(content, idx) in question.question_content" :key="idx" class="content-item">
                  <span v-if="content.type === 'text'">{{ content.content }}</span>
                  <img v-else-if="content.type === 'image'" :src="content.content" class="question-image" />
                </div>
              </div>
              
              <div v-if="question.options" class="question-options">
                <div v-for="(option, optIdx) in question.options" :key="optIdx" class="option-item">
                  {{ String.fromCharCode(65 + optIdx) }}. {{ option }}
                </div>
              </div>
              
              <div class="question-answer">
                <strong>答案:</strong> {{ question.answer }}
              </div>
            </div>
            
            <div class="question-actions">
              <el-button 
                type="text" 
                size="small" 
                @click="editQuestion(index)"
                class="edit-btn"
              >
                编辑
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="importSingleQuestion(index)"
                class="import-btn"
              >
                单独导入
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 加载状态 -->
    <div v-else class="loading-container">
      <el-loading text="正在加载任务详情..."></el-loading>
    </div>

    <!-- 编辑题目模态框 -->
    <el-dialog
      :visible.sync="showEditModal"
      title="编辑题目"
      width="700px"
    >
      <div v-if="editingQuestion">
        <el-form :model="editingQuestion" label-width="80px">
          <el-form-item label="题目内容">
            <div v-for="(content, idx) in editingQuestion.question_content" :key="idx" style="margin-bottom: 10px;">
              <div v-if="content.type === 'text'">
                <el-input
                  type="textarea"
                  v-model="content.content"
                  :rows="3"
                  placeholder="请输入题目内容"
                ></el-input>
              </div>
              <div v-else-if="content.type === 'image'" style="display: flex; align-items: center;">
                <img :src="content.content" style="max-width: 150px; margin-right: 10px;" />
                <el-input
                  v-model="content.content"
                  placeholder="图片URL"
                  style="flex: 1;"
                ></el-input>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="选项">
            <div v-for="(option, optIdx) in editingQuestion.options" :key="optIdx" style="margin-bottom: 8px;">
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px; font-weight: bold;">{{ String.fromCharCode(65 + optIdx) }}.</span>
                <el-input
                  v-model="editingQuestion.options[optIdx]"
                  placeholder="请输入选项内容"
                  style="flex: 1;"
                ></el-input>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="正确答案">
            <el-select v-model="editingQuestion.answer" placeholder="请选择正确答案">
              <el-option
                v-for="(option, optIdx) in editingQuestion.options"
                :key="optIdx"
                :label="String.fromCharCode(65 + optIdx)"
                :value="String.fromCharCode(65 + optIdx)"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditModal = false">取消</el-button>
        <el-button type="primary" @click="saveEditedQuestion">保存修改</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '@admin/api'

export default {
  name: 'PDFImportDetail',
  data() {
    return {
      taskDetail: null,
      selectedQuestions: [],
      selectAll: false,
      isIndeterminate: false,
      showEditModal: false,
      editingQuestion: null,
      editingIndex: -1
    }
  },
  created() {
    this.loadTaskDetail()
  },
  methods: {
    async loadTaskDetail() {
      try {
        const taskId = this.$route.params.id
        const response = await api.getPDFImportTask(taskId)
        this.taskDetail = response.data.data
      } catch (error) {
        console.error('加载任务详情失败:', error)
        this.$message.error('加载任务详情失败')
        this.goBack()
      }
    },
    
    goBack() {
      this.$router.go(-1)
    },
    
    getFileName(filePath) {
      if (!filePath) return ''
      return filePath.split('/').pop()
    },
    
    getStatusTagType(status) {
      const statusMap = {
        'pending': 'info',
        'processing': 'warning', 
        'completed': 'success',
        'failed': 'danger'
      }
      return statusMap[status] || 'info'
    },
    
    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'processing': '处理中',
        'completed': '已完成', 
        'failed': '失败'
      }
      return statusMap[status] || status
    },
    
    formatTime(timeStr) {
      if (!timeStr) return ''
      return new Date(timeStr).toLocaleString('zh-CN')
    },
    
    handleSelectAll(val) {
      if (val) {
        this.selectedQuestions = this.taskDetail.parsed_questions.map((_, index) => index)
      } else {
        this.selectedQuestions = []
      }
      this.updateSelectAllState()
    },
    
    updateSelectAllState() {
      const totalQuestions = this.taskDetail.parsed_questions ? this.taskDetail.parsed_questions.length : 0
      const selectedCount = this.selectedQuestions.length
      
      this.selectAll = selectedCount === totalQuestions && totalQuestions > 0
      this.isIndeterminate = selectedCount > 0 && selectedCount < totalQuestions
    },
    
    async importSelectedQuestions() {
      if (this.selectedQuestions.length === 0) {
        this.$message.warning('请先选择要导入的题目')
        return
      }
      
      try {
        const selectedQuestionsData = this.selectedQuestions.map(index => this.taskDetail.parsed_questions[index])
        await api.batchImportChoiceQuestions({
          task_id: this.taskDetail.id,
          questions: selectedQuestionsData
        })
        this.$message.success(`成功导入 ${this.selectedQuestions.length} 道题目`)
        this.selectedQuestions = []
        this.updateSelectAllState()
      } catch (error) {
        console.error('批量导入失败:', error)
        let errorMessage = '批量导入失败'
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error
        }
        this.$message.error(errorMessage)
      }
    },
    
    async importSingleQuestion(index) {
      try {
        const question = this.taskDetail.parsed_questions[index]
        await api.importChoiceQuestion({
          task_id: this.taskDetail.id,
          question_index: index,
          question_data: question
        })
        this.$message.success('题目导入成功')
      } catch (error) {
        console.error('单个题目导入失败:', error)
        let errorMessage = '题目导入失败'
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error
        }
        this.$message.error(errorMessage)
      }
    },
    
    editQuestion(index) {
      this.editingIndex = index
      this.editingQuestion = JSON.parse(JSON.stringify(this.taskDetail.parsed_questions[index]))
      this.showEditModal = true
    },
    
    saveEditedQuestion() {
      if (this.editingIndex >= 0 && this.editingQuestion) {
        this.taskDetail.parsed_questions[this.editingIndex] = JSON.parse(JSON.stringify(this.editingQuestion))
        this.showEditModal = false
        this.editingQuestion = null
        this.editingIndex = -1
        this.$message.success('题目修改成功')
      }
    }
  },
  
  watch: {
    selectedQuestions() {
      this.updateSelectAllState()
    }
  }
}
</script>

<style scoped>
.pdf-import-detail {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.back-button {
  font-size: 16px;
  margin-right: 15px;
  color: #409EFF;
}

.back-button:hover {
  color: #66b1ff;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
}

.detail-content {
  max-width: 1200px;
}

.info-card, .questions-card {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
  min-width: 80px;
}

.info-item .value {
  color: #303133;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.questions-list {
  max-height: 600px;
  overflow-y: auto;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #e8eaec;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.question-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.question-content {
  flex: 1;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.question-text {
  margin-bottom: 12px;
  line-height: 1.6;
}

.content-item {
  margin-bottom: 8px;
}

.question-image {
  max-width: 200px;
  margin: 8px 0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.question-options {
  margin-bottom: 12px;
}

.option-item {
  margin-bottom: 6px;
  padding: 4px 0;
  color: #606266;
}

.question-answer {
  color: #19be6b;
  font-weight: 500;
}

.question-actions {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-btn {
  color: #409EFF !important;
}

.import-btn {
  color: #67C23A !important;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-import-detail {
    padding: 10px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .question-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .question-actions {
    margin-left: 0;
    margin-top: 15px;
    flex-direction: row;
    justify-content: flex-end;
  }
  
  .questions-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
}
</style>