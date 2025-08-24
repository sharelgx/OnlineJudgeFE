<template>
  <div class="choice-detail">
    <Panel v-if="choice" class="main-panel">
      <div slot="title" class="panel-title">
        <Icon type="ios-help-outline" size="20" style="margin-right: 8px;"/>
        {{ choice.title }}
      </div>
      <div class="choice-content">
        <!-- 题目信息卡片 -->
        <Card class="info-card" dis-hover>
          <div class="choice-info">
            <div class="info-item">
              <Icon type="ios-speedometer-outline" size="16" style="margin-right: 5px;"/>
              <span class="label">难度:</span>
              <span class="difficulty" :class="difficultyClass">{{ difficultyText }}</span>
            </div>
            <div class="info-item">
              <Icon type="ios-star-outline" size="16" style="margin-right: 5px;"/>
              <span class="label">分数:</span>
              <span class="score">{{ choice.total_score }}</span>
            </div>
            <div class="info-item" v-if="tagList.length">
              <Icon type="ios-pricetags-outline" size="16" style="margin-right: 5px;"/>
              <span class="label">标签:</span>
              <span class="tags">
                <Tag v-for="tag in tagList" :key="tag" color="blue">{{ tag }}</Tag>
              </span>
            </div>
          </div>
        </Card>
        
        <!-- 题目描述卡片 -->
        <Card class="description-card" dis-hover>
          <div slot="title" class="card-title">
            <Icon type="ios-paper-outline" size="18" style="margin-right: 8px;"/>
            题目描述
          </div>
          <div class="choice-description" v-html="choice.description"></div>
        </Card>
        
        <!-- 选择答案卡片 -->
        <Card class="options-card" v-if="!submitted" dis-hover>
          <div slot="title" class="card-title">
            <Icon type="ios-checkbox-outline" size="18" style="margin-right: 8px;"/>
            请选择答案
          </div>
          <div class="options">
            <div 
              v-for="(option, index) in choice.options" 
              :key="index"
              class="option-item"
              :class="{ 'selected': selectedOption === index }"
              @click="selectOption(index)"
            >
              <div class="option-header">
                <span class="option-label">{{ String.fromCharCode(65 + index) }}</span>
                <Icon v-if="selectedOption === index" type="ios-checkmark" size="20" class="check-icon"/>
              </div>
              <div class="option-content">
                <span class="option-text" v-html="getOptionHtml(option)"></span>
              </div>
            </div>
          </div>
          
          <div class="submit-section">
            <Button 
              type="primary" 
              size="large"
              :loading="submitting"
              :disabled="selectedOption === null"
              @click="submitAnswer"
              icon="ios-checkmark"
            >
              {{ submitting ? '提交中...' : '提交答案' }}
            </Button>
            <p class="submit-tip" v-if="selectedOption === null">
              <Icon type="ios-information-outline" size="14"/>
              请先选择一个答案
            </p>
          </div>
        </Card>
        
        <!-- 答题结果卡片 -->
        <Card class="result-card" v-if="submitted" dis-hover>
          <div class="result-header">
            <div class="result-status" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
              <Icon 
                :type="isCorrect ? 'ios-checkmark-circle' : 'ios-close-circle'" 
                size="32"
                class="result-icon"
              />
              <span class="result-text">
                {{ isCorrect ? '回答正确!' : '回答错误!' }}
              </span>
            </div>
          </div>
          
          <Divider/>
          
          <div class="answer-analysis">
            <div class="analysis-header">
              <Icon type="ios-analytics" size="18" style="margin-right: 8px;"/>
              <span class="analysis-title">答案解析</span>
            </div>
            
            <Row gutter="16" class="answer-comparison">
              <Col span="12">
                <div class="answer-item correct">
                  <div class="answer-label">
                    <Icon type="ios-checkmark-circle" size="16"/>
                    正确答案
                  </div>
                  <div class="answer-value">{{ String.fromCharCode(65 + correctAnswer) }}</div>
                </div>
              </Col>
              <Col span="12">
                <div class="answer-item" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
                  <div class="answer-label">
                    <Icon :type="isCorrect ? 'ios-checkmark-circle' : 'ios-close-circle'" size="16"/>
                    您的答案
                  </div>
                  <div class="answer-value">{{ String.fromCharCode(65 + selectedOption) }}</div>
                </div>
              </Col>
            </Row>
            
            <div class="explanation" v-if="choice.explanation">
              <div class="explanation-header">
                <Icon type="ios-bulb" size="16" style="margin-right: 6px;"/>
                <strong>详细解析</strong>
              </div>
              <div class="explanation-content" v-html="choice.explanation"></div>
            </div>
          </div>
          
          <Divider/>
          
          <div class="action-buttons">
            <Button size="large" icon="ios-refresh" @click="resetChoice">重新答题</Button>
            <Button type="primary" size="large" icon="ios-arrow-back" @click="$router.push('/choice')">返回列表</Button>
          </div>
        </Card>
      </div>
    </Panel>
    
    <div v-else-if="loading" class="loading">
      <Spin size="large">加载中...</Spin>
    </div>
    
    <div v-else class="error">
      <Alert type="error" show-icon>
        <span slot="desc">题目加载失败，请检查题目ID是否正确</span>
      </Alert>
    </div>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ChoiceDetail',
  data() {
    return {
      choice: null,
      loading: true,
      selectedOption: null,
      submitted: false,
      submitting: false,
      correctAnswer: null,
      isCorrect: false
    }
  },
  computed: {
    difficultyText() {
      const difficultyMap = {
        'Low': '简单',
        'Mid': '中等', 
        'High': '困难'
      }
      return difficultyMap[this.choice && this.choice.difficulty] || (this.choice && this.choice.difficulty)
    },
    difficultyClass() {
      const classMap = {
        'Low': 'easy',
        'Mid': 'medium',
        'High': 'hard'
      }
      return classMap[this.choice && this.choice.difficulty] || 'medium'
    },
    tagList() {
      const tags = this.choice && this.choice.tags
      if (!tags) return []
      if (Array.isArray(tags)) return tags
      if (typeof tags === 'string') {
        try {
          const arr = JSON.parse(tags)
          return Array.isArray(arr) ? arr : []
        } catch (e) {
          return []
        }
      }
      return []
    }
  },
  mounted() {
    this.loadChoice()
  },
  methods: {
    // Convert option object/string to HTML string for rendering
    getOptionHtml (option) {
      if (typeof option === 'string') return option
      if (option && typeof option === 'object') {
        return option.text || option.option_text || ''
      }
      return ''
    },
    async loadChoice() {
      try {
        this.loading = true
        const choiceId = this.$route.params.id
        const res = await api.getChoice(choiceId)
        this.choice = res.data.data
        this.loading = false
      } catch (error) {
        console.error('加载选择题失败:', error)
        this.loading = false
      }
    },
    selectOption(index) {
      if (!this.submitted) {
        this.selectedOption = index
      }
    },
    async submitAnswer() {
      if (this.selectedOption === null) return
      
      // 检查用户是否已登录
      if (!this.$store.getters.isAuthenticated) {
        this.$error('请先登录后再进行答题')
        this.$store.dispatch('changeModalStatus', {
          visible: true,
          mode: 'login'
        })
        return
      }
      
      try {
        this.submitting = true
        const res = await api.submitChoice({
          choice_id: this.choice.id,
          selected_option: this.selectedOption
        })
        
        this.correctAnswer = res.data.data.correct_option
        this.isCorrect = res.data.data.is_correct
        this.submitted = true
        this.submitting = false
      } catch (error) {
        console.error('提交答案失败:', error)
        this.$error('提交失败，请重试')
        this.submitting = false
      }
    },
    resetChoice() {
      this.selectedOption = null
      this.submitted = false
      this.submitting = false
      this.correctAnswer = null
      this.isCorrect = false
    }
  }
}
</script>

<style lang="less" scoped>
// 全局图片尺寸控制 - 最高优先级
.choice-detail /deep/ img {
  max-width: 200px !important;
  width: 200px !important;
  height: auto !important;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 4px 0;
  display: block;
}

.choice-detail {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  
  .main-panel {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    
    .panel-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
    }
  }
}

.choice-content {
  .info-card, .description-card, .options-card, .result-card {
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
    }
  }
  
  .choice-info {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    
    .info-item {
      display: flex;
      align-items: center;
      
      .label {
        font-weight: 500;
        margin-right: 8px;
        color: #666;
      }
      
      .difficulty {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        
        &.easy {
          background: #f6ffed;
          color: #52c41a;
          border: 1px solid #b7eb8f;
        }
        
        &.medium {
          background: #fff7e6;
          color: #fa8c16;
          border: 1px solid #ffd591;
        }
        
        &.hard {
          background: #fff2f0;
          color: #f5222d;
          border: 1px solid #ffb3b3;
        }
      }
      
      .score {
        font-weight: 600;
        color: #1890ff;
        font-size: 14px;
      }
      
      .tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
    }
  }
  
  .choice-description {
    line-height: 1.8;
    font-size: 15px;
    color: #2c3e50;
    
    // 图片尺寸控制 - 使用深度选择器
    /deep/ img {
      max-width: 200px !important;
      width: 200px !important;
      height: auto !important;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin: 8px 0;
      display: block;
    }
  }
  
  .options {
    margin: 16px 0;
    
    .option-item {
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 12px;
      background: #fff;
      
      &:hover {
        border-color: #1890ff;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
        transform: translateY(-1px);
      }
      
      &.selected {
        border-color: #1890ff;
        background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
        box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .option-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px 8px;
        
        .option-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: #1890ff;
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 14px;
        }
        
        .check-icon {
          color: #52c41a;
        }
      }
      
      .option-content {
        padding: 0 16px 12px;
        
        .option-text {
          font-size: 14px;
          line-height: 1.6;
          color: #2c3e50;
          
          // 选项中的图片尺寸控制 - 使用深度选择器
          /deep/ img {
            max-width: 200px !important;
            width: 200px !important;
            height: auto !important;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            margin: 4px 0;
            display: block;
          }
        }
      }
    }
  }
  
  .submit-section {
    text-align: center;
    margin-top: 24px;
    
    .submit-tip {
      margin-top: 12px;
      color: #999;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
  }
  
  .result-header {
    text-align: center;
    padding: 24px 0;
    
    .result-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      
      &.correct {
        .result-icon {
          color: #52c41a;
        }
        
        .result-text {
          color: #52c41a;
        }
      }
      
      &.incorrect {
        .result-icon {
          color: #f5222d;
        }
        
        .result-text {
          color: #f5222d;
        }
      }
      
      .result-text {
        font-size: 20px;
        font-weight: 600;
      }
    }
  }
  
  .answer-analysis {
    .analysis-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      .analysis-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }
    }
    
    .answer-comparison {
      margin-bottom: 20px;
      
      .answer-item {
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        
        &.correct {
          background: linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%);
          border: 2px solid #52c41a;
        }
        
        &.incorrect {
          background: linear-gradient(135deg, #fff2f0 0%, #fff1f0 100%);
          border: 2px solid #f5222d;
        }
        
        .answer-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .answer-value {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }
      }
    }
    
    .explanation {
      margin-top: 20px;
      
      .explanation-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        color: #2c3e50;
      }
      
      .explanation-content {
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #1890ff;
        line-height: 1.7;
        color: #2c3e50;
      }
    }
  }
  
  .action-buttons {
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 16px;
    
    .ivu-btn {
      min-width: 120px;
    }
  }
}

.loading, .error {
  text-align: center;
  padding: 50px;
}

// 响应式设计
@media screen and (max-width: 768px) {
  .choice-detail {
    padding: 12px;
    max-width: 100%;
    
    .main-panel {
      margin: 0;
      border-radius: 4px;
    }
    
    .choice-content {
      .info-card, .description-card, .options-card, .result-card {
        margin-bottom: 16px;
      }
      
      .choice-info {
        flex-direction: column;
        gap: 12px;
        
        .info-item {
          justify-content: space-between;
        }
      }
      
      .options {
        .option-item {
          .option-header {
            padding: 10px 12px 6px;
            
            .option-label {
              width: 24px;
              height: 24px;
              font-size: 12px;
            }
          }
          
          .option-content {
            padding: 0 12px 10px;
            
            .option-text {
              font-size: 13px;
            }
          }
        }
      }
      
      .answer-comparison {
        .answer-item {
          padding: 12px;
          
          .answer-value {
            font-size: 20px;
          }
        }
      }
      
      .action-buttons {
        flex-direction: column;
        gap: 12px;
        
        .ivu-btn {
          width: 100%;
          min-width: auto;
        }
      }
    }
  }
}

@media screen and (max-width: 480px) {
  .choice-detail {
    padding: 8px;
    
    .panel-title {
      font-size: 16px;
    }
    
    .card-title {
      font-size: 14px;
    }
    
    .result-status {
      .result-text {
        font-size: 18px;
      }
    }
  }
}
</style>