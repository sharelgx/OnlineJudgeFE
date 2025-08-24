<template>
  <div class="choice-editor">
    <el-card class="main-card" shadow="hover">
      <div slot="header" class="card-header">
        <i class="el-icon-edit"></i>
        <span>{{ title }}</span>
      </div>
      
      <el-form ref="form" :model="choice" :rules="rules" label-position="top" label-width="80px">
        <!-- 基本信息卡片 -->
        <el-card class="info-card" shadow="never">
          <div slot="header" class="section-header">
            <i class="el-icon-info"></i>
            <span>基本信息</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="18">
              <el-form-item prop="title" label="标题">
                <el-input placeholder="留空则自动截取题目描述前几个汉字作为标题" v-model="choice.title" @input="handleTitleInput" maxlength="32" show-word-limit></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="难度">
                <el-select v-model="choice.difficulty" size="small" placeholder="选择难度">
                  <el-option label="简单" value="Low"></el-option>
                  <el-option label="中等" value="Mid"></el-option>
                  <el-option label="困难" value="High"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="多选题">
                <el-switch v-model="choice.multiple" active-text="多选" inactive-text="单选"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公开可见">
                <el-switch v-model="choice.is_public" active-text="公开" inactive-text="私有"></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分类">
                <el-select v-model="choice.categories" multiple filterable placeholder="选择分类">
                  <el-option v-for="category in categoryList" :key="category.id" :label="category.name" :value="category.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签">
                <el-select v-model="choice.tagIds" multiple filterable placeholder="选择标签">
                  <el-option v-for="tag in tagList" :key="tag.id" :label="tag.name" :value="tag.id"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
        
        <!-- 题目内容卡片 -->
        <el-card class="content-card" shadow="never">
          <div slot="header" class="section-header">
            <i class="el-icon-document"></i>
            <span>题目内容</span>
          </div>
          <el-form-item label="题目描述">
            <Simditor v-model="choice.description"></Simditor>
          </el-form-item>
          <el-form-item label="答案解析">
            <Simditor v-model="choice.explanation"></Simditor>
          </el-form-item>
        </el-card>
        
        <!-- 选项设置卡片 -->
        <el-card class="options-card" shadow="never">
          <div slot="header" class="section-header">
            <i class="el-icon-menu"></i>
            <span>选项设置</span>
            <el-button type="primary" size="mini" icon="el-icon-plus" @click="addOption" style="float: right;">添加选项</el-button>
          </div>
          <div class="answer-hint">
            <el-alert
              :title="choice.multiple ? '请至少选择一个正确答案（多选题）' : '请选择一个正确答案（单选题）'"
              type="info"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
          <div class="options-container">
            <el-form-item v-for="(opt, index) in choice.options" :key="'opt'+index">
              <div class="option-card">
                <div class="option-header">
                  <span class="option-label">选项 {{ String.fromCharCode(65 + index) }}</span>
                  <div class="option-controls">
                    <el-checkbox v-if="choice.multiple" v-model="opt.correct" class="correct-checkbox">正确答案</el-checkbox>
                    <el-radio v-else v-model="singleAnswer" :label="index" class="correct-radio">正确答案</el-radio>
                    <el-button type="danger" size="mini" icon="el-icon-delete" @click="deleteOption(index)" plain>删除</el-button>
                  </div>
                </div>
                <div class="option-content">
                  <Simditor v-model="opt.text"></Simditor>
                </div>
              </div>
            </el-form-item>
          </div>
        </el-card>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <el-button type="primary" size="large" icon="el-icon-check" @click="onSubmit">保存选择题</el-button>
          <el-button size="large" @click="$router.back()">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import api from '../../api.js'
import Accordion from '../../components/Accordion.vue'
import Simditor from '../../components/Simditor.vue'

export default {
  name: 'ChoiceEditor',
  components: { Accordion, Simditor },
  data () {
    return {
      title: '新建选择题',
      routeName: '',
      id: null,
      singleAnswer: null,
      categoryList: [],
      tagList: [],
      choice: {
        title: '',
        description: '',
        explanation: '',
        difficulty: 'Low',
        multiple: false,
        is_public: true,
        tags: [],
        categories: [],
        tagIds: [],
        options: [ { text: '', correct: false }, { text: '', correct: false } ]
      },
      rules: {
        // title: [{ required: true, message: '请填写标题', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.routeName = this.$route.name
    this.loadCategoriesAndTags()
    if (this.routeName === 'edit-choice') {
      this.title = '编辑选择题'
      this.id = this.$route.params.choiceId
      this.getDetail(this.id)
    }
  },
  watch: {
    'choice.multiple' (val) {
      if (!val) {
        // 切换到单选，仅保留一个正确项
        if (this.singleAnswer === null) {
          const idx = this.choice.options.findIndex(o => o.correct)
          this.singleAnswer = idx >= 0 ? idx : null
        }
        this.choice.options.forEach((o, i) => { o.correct = (i === this.singleAnswer) })
      }
    },
    singleAnswer (val) {
      if (!this.choice.multiple) this.choice.options.forEach((o, i) => { o.correct = (i === val) })
    },
    // 当描述变化且标题为空时，自动从描述截取前16个字符作为标题
    'choice.description'(val) {
      if (!this.choice.title || !this.choice.title.trim()) {
        const auto = this.autoTitleFromDescription(val)
        if (auto) this.choice.title = auto
      }
    }
  },
  methods: {
    // 处理标题输入，自动截取16个汉字
    handleTitleInput (value) {
      if (value && value.length > 16) {
        // 截取前16个字符
        this.choice.title = value.substring(0, 16)
        this.$nextTick(() => {
          // 显示提示信息
          this.$message({
            message: '标题已自动截取为前16个字符',
            type: 'info',
            duration: 2000
          })
        })
      }
    },
    // 从富文本描述中提取纯文本并生成标题
    extractText (html) {
      const div = document.createElement('div')
      div.innerHTML = html || ''
      let text = div.textContent || div.innerText || ''
      // 去除所有空白字符与不间断空格
      text = text.replace(/\u00A0/g, ' ').replace(/\s+/g, '')
      return text
    },
    autoTitleFromDescription (html) {
      const text = this.extractText(html)
      if (!text) return ''
      const max = 16
      return text.slice(0, max)
    },
    getDetail (id) {
      api.getChoice(id).then(res => {
        const d = res.data.data
        // 兼容后端字段
        this.choice.title = d.title || ''
        this.choice.description = d.description || ''
        this.choice.explanation = d.explanation || d.analysis || ''
        this.choice.difficulty = d.difficulty || 'Low'
        this.choice.tags = d.tags || []
        this.choice.categories = d.categories || []
        this.choice.tagIds = d.tag_ids || []
        this.choice.multiple = !!d.multiple
        this.choice.is_public = d.is_public !== undefined ? !!d.is_public : true
        // 选项与答案：兼容 options 为字符串数组或对象数组，并兼容 answer/answers 多种格式
        if (Array.isArray(d.options)) {
          if (typeof d.options[0] === 'string') {
            this.choice.options = d.options.map((t) => ({ text: t, correct: false }))
          } else {
            this.choice.options = d.options.map(o => ({ text: o.text, correct: !!o.correct }))
          }
          // 解析答案索引（兼容 0 基与 1 基）
          let indices = []
          const toZeroBased = (val, len) => {
            const n = parseInt(val)
            if (isNaN(n)) return null
            if (n >= 0 && n < len) return n // 已是 0 基
            if (n >= 1 && n <= len) return n - 1 // 1 基转 0 基
            return null
          }
          if (d.answer !== undefined && d.answer !== null) {
            if (typeof d.answer === 'string') {
              indices = d.answer.split('').map(ch => ch.charCodeAt(0) - 65).filter(i => i >= 0)
            } else if (typeof d.answer === 'number') {
              const z = toZeroBased(d.answer, this.choice.options.length)
              indices = z === null ? [] : [z]
            } else if (Array.isArray(d.answer)) {
              indices = d.answer.map(x => toZeroBased(x, this.choice.options.length)).filter(x => x !== null)
            }
          } else if (Array.isArray(d.answers)) {
            indices = d.answers.map(x => toZeroBased(x, this.choice.options.length)).filter(x => x !== null)
          }
          this.choice.options.forEach((o, i) => { o.correct = indices.indexOf(i) !== -1 })
          if (!this.choice.multiple) this.singleAnswer = indices.length ? indices[0] : null
        }
      })
    },
    addOption () {
      this.choice.options.push({ text: '', correct: false })
    },
    deleteOption (index) {
      this.choice.options.splice(index, 1)
      if (!this.choice.multiple) {
        if (this.singleAnswer === index) this.singleAnswer = null
        if (this.singleAnswer > index) this.singleAnswer -= 1
      }
    },
    loadCategoriesAndTags () {
      // 加载分类列表
      api.getCategoryList().then(res => {
        this.categoryList = res.data.data.results || []
      }).catch(() => {})
      // 加载标签列表
      api.getTagList().then(res => {
        this.tagList = res.data.data.results || []
      }).catch(() => {})
    },
    serialize () {
      // 清洗选项：用纯文本判断是否为空，但保留原有富文本内容提交；丢弃空内容选项，并建立索引映射
      const raw = this.choice.options.map((o, i) => {
        const html = o.text || ''
        const plain = this.extractText(html) // 去标签后的纯文本（移除空白）
        return { html, plain, correct: !!o.correct, oldIndex: i }
      })
      const kept = raw.filter(o => o.plain.length > 0)
      const indexMap = new Map()
      kept.forEach((o, idx) => indexMap.set(o.oldIndex, idx))

      // 保留原有富文本作为最终提交的选项内容
      const optionsText = kept.map(o => o.html)
      const originalCorrect = []
      this.choice.options.forEach((o, i) => { if (o.correct) originalCorrect.push(i) })
      // 重新映射到清洗后的索引
      const mapped = originalCorrect
        .map(i => indexMap.has(i) ? indexMap.get(i) : null)
        .filter(i => i !== null)

      // 按后端校验使用 1 基索引
      let answer = null
      if (this.choice.multiple) {
        answer = mapped.map(i => i + 1) // 1-based index array
      } else {
        answer = mapped.length ? (mapped[0] + 1) : null // 1-based single index
      }
      // 兼容性映射：难度字符串转数字
      const difficultyMap = { 'Low': 1, 'Mid': 2, 'High': 3 }
      const difficultyNum = difficultyMap[this.choice.difficulty] || 1
      
      // 兼容性：同时提供 0-based 和 1-based 答案索引
      let answer0Based = null
      let answers0Based = []
      let answers1Based = []
      
      if (this.choice.multiple) {
        answers1Based = mapped.map(i => i + 1)
        answers0Based = mapped.slice()
        answer0Based = answers0Based.length ? answers0Based[0] : null
      } else {
        answer0Based = mapped.length ? mapped[0] : null
        answers1Based = answer0Based !== null ? [answer0Based + 1] : []
        answers0Based = answer0Based !== null ? [answer0Based] : []
      }
      
      // 新的统一格式：使用is_correct结构的选项数组
      const optionsWithCorrect = optionsText.map((html, i) => ({
        option_text: html,
        is_correct: (this.choice.multiple ? answers0Based : [answer0Based]).includes(i)
      }))
      
      // 兼容性：选项对象格式（保留旧字段名）
      const optionsDetail = optionsText.map((html, i) => ({
        content: html,
        text: this.extractText(html),
        is_correct: (this.choice.multiple ? answers0Based : [answer0Based]).includes(i)
      }))
      
      return {
        title: this.choice.title,
        description: this.choice.description,
        explanation: this.choice.explanation,
        difficulty: this.choice.difficulty,
        categories: this.choice.categories,
        tag_ids: this.choice.tagIds,
        multiple: this.choice.multiple,
        is_public: this.choice.is_public,
        // 后端期望的格式：字符串数组作为options
        options: optionsText, // 直接发送HTML字符串数组
        // 后端期望的格式：0-based索引作为answer
        answer: this.choice.multiple ? mapped : (mapped.length ? mapped[0] : 0)
      }
    },
    onSubmit () {
      // 若标题为空，则根据描述自动生成
      if (!this.choice.title || !this.choice.title.trim()) {
        const auto = this.autoTitleFromDescription(this.choice.description)
        if (auto) this.choice.title = auto
      }
      this.$refs.form.validate(valid => {
        if (!valid) return
        const payload = this.serialize()
        // 校验：至少两个非空选项
        if (!Array.isArray(payload.options) || payload.options.length < 2) {
          this.$message.error('请至少保留两个非空选项')
          return
        }
        // 校验：答案有效且在范围内（使用0-based索引）
        const inRange = (n) => Number.isInteger(n) && n >= 0 && n < payload.options.length
        if (this.choice.multiple) {
          if (!Array.isArray(payload.answer) || payload.answer.length === 0 || !payload.answer.every(inRange)) {
            this.$message({
              message: '多选题请至少选择一个正确答案！',
              type: 'warning',
              duration: 3000
            })
            return
          }
        } else {
          if (payload.answer === null || payload.answer === undefined || !inRange(payload.answer)) {
            this.$message({
              message: '单选题请选择一个正确答案！',
              type: 'warning',
              duration: 3000
            })
            return
          }
        }
        const action = this.routeName === 'edit-choice' ? api.editChoice : api.createChoice
        if (this.routeName === 'edit-choice') payload.id = this.id
        action(payload).then((response) => {
          this.$message.success(this.routeName === 'edit-choice' ? '选择题修改成功' : '选择题创建成功')
          this.$router.push({ name: 'choice-list' })
        }).catch((error) => {
          console.error('API调用失败:', error)
          let errorMsg = '未知错误'
          if (error.response && error.response.data && error.response.data.error) {
            errorMsg = error.response.data.error
          } else if (error.message) {
            errorMsg = error.message
          }
          this.$message.error('操作失败: ' + errorMsg)
        })
      })
    }
  }
}
</script>

<style scoped>
.choice-editor {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-header i {
  margin-right: 8px;
  color: #409EFF;
}

.info-card,
.content-card,
.options-card {
  margin-bottom: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
}

.section-header {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  display: flex;
  align-items: center;
}

.answer-hint {
  margin-bottom: 15px;
}

.answer-hint .el-alert {
  border-radius: 6px;
}

.section-header i {
  margin-right: 8px;
  color: #909399;
}

.options-container {
  max-height: 600px;
  overflow-y: auto;
}

.option-card {
  border: 1px solid #E4E7ED;
  border-radius: 6px;
  margin-bottom: 15px;
  background: #FAFAFA;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #F5F7FA;
  border-bottom: 1px solid #E4E7ED;
  border-radius: 6px 6px 0 0;
}

.option-label {
  font-weight: 500;
  color: #303133;
}

.option-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.correct-checkbox,
.correct-radio {
  margin-right: 8px;
}

.option-content {
  padding: 16px;
}

.actions {
  margin-top: 30px;
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #EBEEF5;
}

.actions .el-button {
  margin: 0 10px;
  min-width: 120px;
}

/* 图片尺寸控制 */
.choice-editor >>> .simditor .simditor-body img {
  max-width: 200px !important;
  height: auto !important;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 富文本编辑器样式优化 */
.choice-editor >>> .simditor {
  border-radius: 4px;
  border: 1px solid #DCDFE6;
}

.choice-editor >>> .simditor:focus-within {
  border-color: #409EFF;
}

.choice-editor >>> .simditor .simditor-body {
  height: 200px !important;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .choice-editor {
    padding: 10px;
  }
  
  .option-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .option-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .actions .el-button {
    display: block;
    width: 100%;
    margin: 5px 0;
  }
}
</style>