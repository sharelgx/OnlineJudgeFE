<template>
  <div class="choice-detail">
    <Card shadow>
      <div slot="title">
        <Icon type="ios-help-circle" size="20"></Icon>
        {{ choice.title }}
        <Tag v-if="choice.difficulty" :color="getDifficultyColor(choice.difficulty)" style="margin-left: 10px;">
          {{ choice.difficulty }}
        </Tag>
        <span style="float: right; font-size: 14px; color: #999;">
          分值: {{ choice.score }}分
        </span>
      </div>
      
      <div v-if="loading" style="text-align: center; padding: 50px;">
        <Spin size="large"></Spin>
        <p style="margin-top: 10px;">加载中...</p>
      </div>
      
      <div v-else-if="choice.id">
        <!-- 题目描述 -->
        <div class="choice-description">
          <h3>题目描述</h3>
          <div v-html="choice.description" class="markdown-body"></div>
        </div>
        
        <!-- 选项 -->
        <div class="choice-options" style="margin-top: 30px;">
          <h3>选择答案</h3>
          <RadioGroup v-model="selectedOption" :disabled="submitted">
            <div v-for="option in choice.options" :key="option.id" class="option-item">
              <Radio :label="option.id" style="margin-bottom: 15px;">
                <span class="option-label">{{ getOptionLetter(option.option_order) }}.</span>
                <span class="option-text">{{ option.option_text }}</span>
              </Radio>
            </div>
          </RadioGroup>
        </div>
        
        <!-- 提交按钮 -->
        <div style="margin-top: 30px; text-align: center;" v-if="!submitted">
          <Button type="primary" size="large" @click="submitAnswer" :loading="submitting" :disabled="!selectedOption">
            提交答案
          </Button>
        </div>
        
        <!-- 结果显示 -->
        <div v-if="submitted" class="result-section" style="margin-top: 30px;">
          <Alert :type="result.correct ? 'success' : 'error'" show-icon>
            <span slot="desc">
              <strong>{{ result.correct ? '回答正确！' : '回答错误！' }}</strong>
              <br>
              您的答案: {{ getOptionLabel(selectedOption) }}
              <br>
              正确答案: {{ getOptionLabel(choice.correct_option) }}
            </span>
          </Alert>
          
          <!-- 解析 -->
          <div v-if="choice.explanation" class="explanation" style="margin-top: 20px;">
            <h4>题目解析</h4>
            <div v-html="choice.explanation" class="markdown-body"></div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <Button @click="resetChoice" style="margin-right: 10px;">重新作答</Button>
            <Button type="primary" @click="goBack">返回列表</Button>
          </div>
        </div>
      </div>
      
      <div v-else style="text-align: center; padding: 50px;">
        <Icon type="ios-alert" size="50" color="#ed4014"></Icon>
        <p style="margin-top: 10px; font-size: 16px;">题目不存在或已被删除</p>
        <Button type="primary" @click="goBack" style="margin-top: 10px;">返回列表</Button>
      </div>
    </Card>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ChoiceDetail',
  data () {
    return {
      loading: true,
      submitting: false,
      submitted: false,
      choice: {},
      selectedOption: null,
      result: {}
    }
  },
  mounted () {
    this.getChoiceDetail()
  },
  methods: {
    async getChoiceDetail () {
      this.loading = true
      try {
        const res = await api.getChoice(this.$route.params.id)
        this.choice = res.data.data
      } catch (err) {
        this.$error('获取题目详情失败')
        console.error(err)
      }
      this.loading = false
    },
    
    async submitAnswer () {
      if (!this.selectedOption) {
        this.$error('请选择一个答案')
        return
      }
      
      this.submitting = true
      try {
        const res = await api.submitChoiceAnswer({
          choice_id: this.choice.id,
          selected_option: this.selectedOption
        })
        
        this.result = res.data.data
        this.submitted = true
        
        if (this.result.correct) {
          this.$success('回答正确！')
        } else {
          this.$error('回答错误，请查看解析')
        }
      } catch (err) {
        this.$error('提交答案失败')
        console.error(err)
      }
      this.submitting = false
    },
    
    resetChoice () {
      this.selectedOption = null
      this.submitted = false
      this.result = {}
    },
    
    goBack () {
      this.$router.push('/choice')
    },
    
    getDifficultyColor (difficulty) {
      const colorMap = {
        'Low': 'success',
        'Mid': 'warning', 
        'High': 'error'
      }
      return colorMap[difficulty] || 'default'
    },
    
    getOptionLabel (optionId) {
      const option = this.choice.options && this.choice.options.find(opt => opt.id === optionId)
      return option ? `${this.getOptionLetter(option.option_order)}. ${option.option_text}` : '未知选项'
    },
    
    getOptionLetter (order) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      return letters[order - 1] || order
    }
  },
  
  watch: {
    '$route' (to, from) {
      if (to.params.id !== from.params.id) {
        this.getChoiceDetail()
        this.resetChoice()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.choice-detail {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.choice-description {
  h3 {
    color: #495060;
    margin-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 8px;
  }
}

.choice-options {
  h3 {
    color: #495060;
    margin-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 8px;
  }
  
  .option-item {
    padding: 10px;
    border: 1px solid #e8eaec;
    border-radius: 4px;
    margin-bottom: 10px;
    transition: all 0.3s;
    
    &:hover {
      border-color: #2d8cf0;
      background-color: #f8f9fa;
    }
    
    .option-label {
      font-weight: bold;
      margin-right: 8px;
      color: #2d8cf0;
    }
    
    .option-text {
      color: #495060;
    }
  }
}

.result-section {
  .explanation {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 4px;
    border-left: 4px solid #2d8cf0;
    
    h4 {
      color: #495060;
      margin-bottom: 15px;
    }
  }
}

.markdown-body {
  line-height: 1.6;
  color: #495060;
  
  p {
    margin-bottom: 10px;
  }
  
  code {
    background: #f1f1f1;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  pre {
    background: #f8f8f8;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    
    code {
      background: none;
      padding: 0;
    }
  }
}
</style>