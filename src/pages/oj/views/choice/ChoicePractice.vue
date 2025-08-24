<template>
  <div class="choice-practice">
    <Card>
      <div slot="title">
        <Icon type="ios-book" />
        批量练习 ({{ currentIndex + 1 }}/{{ choiceIds.length }})
      </div>
      <div slot="extra">
        <Button type="primary" @click="exitPractice">退出练习</Button>
      </div>
      
      <div v-if="loading" class="loading-container">
        <Spin size="large">加载中...</Spin>
      </div>
      
      <div v-else-if="currentChoice" class="practice-content">
        <div class="choice-header">
          <h2>{{ currentChoice.title }}</h2>
          <div class="choice-meta">
            <Tag :color="getDifficultyColor(currentChoice.difficulty)">{{ currentChoice.difficulty }}</Tag>
            <span class="score">分值: {{ currentChoice.score }}</span>
          </div>
        </div>
        
        <div class="choice-content" v-html="currentChoice.content"></div>
        
        <div class="choice-options">
          <RadioGroup v-model="selectedOption" @on-change="onOptionChange">
            <div v-for="option in currentChoice.options" :key="option.id" class="option-item">
              <Radio :label="option.id">
                <span class="option-label">{{ option.label }}.</span>
                <span class="option-content" v-html="option.content"></span>
              </Radio>
            </div>
          </RadioGroup>
        </div>
        
        <div class="submit-section" v-if="!answered">
          <Button type="primary" @click="submitAnswer" :disabled="!selectedOption" :loading="submitting">
            提交答案
          </Button>
        </div>
        
        <div class="answer-section" v-if="answered">
          <Alert :type="isCorrect ? 'success' : 'error'" show-icon>
            <span slot="desc">
              <p><strong>{{ isCorrect ? '回答正确！' : '回答错误！' }}</strong></p>
              <p>正确答案: {{ getCorrectOptionLabel() }}</p>
              <div v-if="currentChoice.explanation" class="explanation">
                <h4>解析:</h4>
                <div v-html="currentChoice.explanation"></div>
              </div>
            </span>
          </Alert>
          
          <div class="next-section">
            <Button type="primary" @click="nextChoice" v-if="hasNext">下一题</Button>
            <Button type="success" @click="finishPractice" v-else>完成练习</Button>
          </div>
        </div>
      </div>
      
      <div v-else-if="practiceCompleted" class="practice-summary">
        <div class="summary-header">
          <Icon type="ios-checkmark-circle" size="48" color="#19be6b" />
          <h2>练习完成！</h2>
        </div>
        <div class="summary-stats">
          <Row :gutter="16">
            <Col span="8">
              <div class="stat-item">
                <div class="stat-number">{{ choiceIds.length }}</div>
                <div class="stat-label">总题数</div>
              </div>
            </Col>
            <Col span="8">
              <div class="stat-item">
                <div class="stat-number correct">{{ correctCount }}</div>
                <div class="stat-label">正确</div>
              </div>
            </Col>
            <Col span="8">
              <div class="stat-item">
                <div class="stat-number wrong">{{ wrongCount }}</div>
                <div class="stat-label">错误</div>
              </div>
            </Col>
          </Row>
        </div>
        <div class="summary-actions">
          <Button type="primary" @click="viewWrongBook">查看错题本</Button>
          <Button @click="exitPractice">返回题库</Button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import api from '@oj/api'

export default {
  name: 'ChoicePractice',
  data () {
    return {
      choiceIds: [],
      currentIndex: 0,
      currentChoice: null,
      selectedOption: null,
      answered: false,
      isCorrect: false,
      loading: false,
      submitting: false,
      practiceCompleted: false,
      correctCount: 0,
      wrongCount: 0
    }
  },
  computed: {
    hasNext () {
      return this.currentIndex < this.choiceIds.length - 1
    }
  },
  mounted () {
    this.initPractice()
  },
  methods: {
    initPractice () {
      const ids = this.$route.query.ids
      if (!ids) {
        this.$error('练习参数错误')
        this.$router.push({ name: 'choice-list' })
        return
      }
      this.choiceIds = ids.split(',').map(id => parseInt(id))
      this.loadCurrentChoice()
    },
    
    async loadCurrentChoice () {
      if (this.currentIndex >= this.choiceIds.length) {
        this.practiceCompleted = true
        return
      }
      
      this.loading = true
      try {
        const choiceId = this.choiceIds[this.currentIndex]
        const res = await api.getChoice(choiceId)
        this.currentChoice = res.data.data
        this.selectedOption = null
        this.answered = false
        this.isCorrect = false
      } catch (error) {
        this.$error('加载题目失败')
      } finally {
        this.loading = false
      }
    },
    
    onOptionChange (optionId) {
      this.selectedOption = optionId
    },
    
    async submitAnswer () {
      if (!this.selectedOption) return
      
      this.submitting = true
      try {
        const res = await api.submitChoice({
          choice_id: this.currentChoice.id,
          option_id: this.selectedOption
        })
        
        this.answered = true
        this.isCorrect = res.data.data.is_correct
        
        if (this.isCorrect) {
          this.correctCount++
        } else {
          this.wrongCount++
        }
      } catch (error) {
        this.$error('提交答案失败')
      } finally {
        this.submitting = false
      }
    },
    
    nextChoice () {
      this.currentIndex++
      this.loadCurrentChoice()
    },
    
    finishPractice () {
      this.practiceCompleted = true
    },
    
    exitPractice () {
      this.$router.push({ name: 'choice-list' })
    },
    
    viewWrongBook () {
      this.$router.push({ name: 'wrong-book' })
    },
    
    getDifficultyColor (difficulty) {
      const colorMap = {
        'Low': 'green',
        'Mid': 'orange', 
        'High': 'red'
      }
      return colorMap[difficulty] || 'default'
    },
    
    getCorrectOptionLabel () {
      if (!this.currentChoice || !this.currentChoice.options) return ''
      const correctOption = this.currentChoice.options.find(opt => opt.is_correct)
      return correctOption ? correctOption.label : ''
    }
  }
}
</script>

<style scoped>
.choice-practice {
  padding: 20px;
}

.loading-container {
  text-align: center;
  padding: 50px 0;
}

.practice-content {
  max-width: 800px;
  margin: 0 auto;
}

.choice-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e8eaec;
}

.choice-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.choice-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.score {
  color: #666;
  font-size: 14px;
}

.choice-content {
  margin-bottom: 25px;
  line-height: 1.6;
  font-size: 16px;
}

.choice-options {
  margin-bottom: 25px;
}

.option-item {
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #e8eaec;
  border-radius: 4px;
  transition: all 0.3s;
}

.option-item:hover {
  border-color: #2d8cf0;
  background-color: #f8f9fa;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
}

.submit-section {
  text-align: center;
  margin: 30px 0;
}

.answer-section {
  margin-top: 25px;
}

.explanation {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e8eaec;
}

.explanation h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.next-section {
  text-align: center;
  margin-top: 20px;
}

.practice-summary {
  text-align: center;
  padding: 40px 20px;
}

.summary-header h2 {
  margin: 15px 0 0 0;
  color: #333;
}

.summary-stats {
  margin-bottom: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-number.correct {
  color: #19be6b;
}

.stat-number.wrong {
  color: #ed4014;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>