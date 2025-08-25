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
                <el-select v-model="choice.tag_ids" multiple filterable placeholder="选择标签">
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
        categories: [],
        tag_ids: [],
        options: [ { text: '', correct: false }, { text: '', correct: false } ]
      },
      rules: {}
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
    'choice.description'(val) {
      if (!this.choice.title || !this.choice.title.trim()) {
        const auto = this.autoTitleFromDescription(val)
        if (auto) this.choice.title = auto
      }
    }
  },
  methods: {
    handleTitleInput (value) {
      if (value && value.length > 16) {
        this.choice.title = value.substring(0, 16)
        this.$nextTick(() => {
          this.$message({ message: '标题已自动截取为前16个字符', type: 'info', duration: 2000 })
        })
      }
    },
    extractText (html) {
      const div = document.createElement('div')
      div.innerHTML = html || ''
      let text = div.textContent || div.innerText || ''
      text = text.replace(/\u00A0/g, ' ').replace(/\s+/g, '')
      return text
    },
    autoTitleFromDescription (html) {
      const text = this.extractText(html)
      if (!text) return ''
      return text.slice(0, 16)
    },
    getDetail (id) {
      api.getChoice(id).then(res => {
        const d = res.data.data
        this.choice.title = d.title || ''
        this.choice.description = d.description || ''
        this.choice.explanation = d.explanation || d.analysis || ''
        this.choice.difficulty = d.difficulty || 'Low'
        this.choice.categories = d.categories || []
        this.choice.tag_ids = d.tag_ids || []
        this.choice.multiple = !!d.multiple
        this.choice.is_public = d.is_public !== undefined ? !!d.is_public : true
        if (Array.isArray(d.options)) {
          if (typeof d.options[0] === 'string') {
            this.choice.options = d.options.map((t) => ({ text: t, correct: false }))
          } else {
            this.choice.options = d.options.map(o => ({ text: o.text, correct: !!o.correct }))
          }
          let indices = []
          const toZeroBased = (val, len) => {
            const n = parseInt(val)
            if (isNaN(n)) return null
            if (n >= 0 && n < len) return n
            if (n >= 1 && n <= len) return n - 1
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
    addOption () { this.choice.options.push({ text: '', correct: false }) },
    deleteOption (index) {
      this.choice.options.splice(index, 1)
      if (!this.choice.multiple) {
        if (this.singleAnswer === index) this.singleAnswer = null
        if (this.singleAnswer > index) this.singleAnswer -= 1
      }
    },
    loadCategoriesAndTags () {
      api.getCategoryList().then(res => { this.categoryList = res.data.data.results || [] }).catch(() => {})
      api.getTagList().then(res => { this.tagList = res.data.data.results || [] }).catch(() => {})
    },

    // ===== 修改后的序列化方法 =====
    serialize() {
      const rawOptions = this.choice.options.map((o, i) => {
        const html = o.text || ''
        const plain = this.extractText(html)
        return { html, plain, correct: !!o.correct, oldIndex: i }
      }).filter(o => o.plain.length > 0)

      if (rawOptions.length < 2) return null

      const correctIndices = rawOptions
        .map((o, idx) => ({ idx, oldIndex: o.oldIndex }))
        .filter(o => this.choice.options[o.oldIndex].correct)
        .map(o => o.idx)

      let answer = null
      if (this.choice.multiple) {
        answer = correctIndices
      } else {
        answer = correctIndices.length ? correctIndices[0] : null
      }

      return {
        title: this.choice.title || this.autoTitleFromDescription(this.choice.description),
        description: this.choice.description,
        explanation: this.choice.explanation,
        difficulty: this.choice.difficulty,
        categories: this.choice.categories,
        tag_ids: this.choice.tag_ids,
        multiple: this.choice.multiple,
        is_public: this.choice.is_public,
        options: rawOptions.map(o => o.html),
        answer
      }
    },

    // ===== 修改后的提交方法 =====
    onSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) return

        const payload = this.serialize()
        if (!payload) {
          this.$message.error('请至少保留两个非空选项')
          return
        }

        const optionsLen = payload.options.length
        const inRange = n => Number.isInteger(n) && n >= 0 && n < optionsLen

        if (payload.multiple) {
          if (!Array.isArray(payload.answer) || payload.answer.length === 0 || !payload.answer.every(inRange)) {
            this.$message.warning('多选题请至少选择一个正确答案！')
            return
          }
        } else {
          if (payload.answer === null || !inRange(payload.answer)) {
            this.$message.warning('单选题请选择一个正确答案！')
            return
          }
        }

        if (this.routeName === 'edit-choice') payload.id = this.id
        const action = this.routeName === 'edit-choice' ? api.editChoice : api.createChoice

        console.log('提交 payload:', JSON.stringify(payload, null, 2))

        action(payload)
          .then(() => {
            this.$message.success(this.routeName === 'edit-choice' ? '选择题修改成功' : '选择题创建成功')
            this.$router.push({ name: 'choice-list' })
          })
          .catch(error => {
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
.choice-editor { padding: 20px; }
.card-header, .section-header { font-weight: bold; font-size: 16px; }
.option-card { margin-bottom: 12px; border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; }
.option-header { display: flex; justify-content: space-between; align-items: center; }
.option-label { font-weight: bold; }
.option-controls { display: flex; align-items: center; gap: 10px; }
.actions { margin-top: 20px; display: flex; gap: 10px; }
</style>
