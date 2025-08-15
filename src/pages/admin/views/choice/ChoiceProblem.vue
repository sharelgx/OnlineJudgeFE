<template>
  <div class="view">
    <Panel :title="title">
      <el-form label-position="top" :model="choiceProblem" :rules="ruleValidate" ref="formChoiceProblem">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="$t('m.Display_ID')" prop="_id" required>
              <el-input
                v-model="choiceProblem._id"
                :disabled="mode === 'edit'"
                :placeholder="$t('m.Display_ID')">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="$t('m.Title')" prop="title" required>
              <el-input v-model="choiceProblem.title" :placeholder="$t('m.Title')"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item :label="$t('m.Description')" prop="description" required>
              <Simditor v-model="choiceProblem.description"></Simditor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="选项" prop="options" required>
              <div v-for="(option, index) in choiceProblem.options" :key="index" class="choice-option">
                <el-row :gutter="10">
                  <el-col :span="2">
                    <el-tag>{{option.key}}</el-tag>
                  </el-col>
                  <el-col :span="20">
                    <Simditor v-model="option.value" :placeholder="'选项 ' + option.key"></Simditor>
                  </el-col>
                  <el-col :span="2">
                    <el-button
                      v-if="choiceProblem.options.length > 2"
                      @click="deleteOption(index)"
                      type="danger"
                      size="small"
                      icon="el-icon-delete">
                    </el-button>
                  </el-col>
                </el-row>
              </div>
              <el-button
                v-if="choiceProblem.options.length < 6"
                @click="addOption"
                type="primary"
                size="small"
                icon="el-icon-plus">
                添加选项
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="正确答案" prop="correct_answer" required>
              <el-select v-model="choiceProblem.correct_answer" placeholder="选择正确答案">
                <el-option
                  v-for="option in choiceProblem.options"
                  :key="option.key"
                  :label="option.key + '. ' + option.value"
                  :value="option.key">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="choiceProblem.difficulty" placeholder="选择难度">
                <el-option label="简单" value="Low"></el-option>
                <el-option label="中等" value="Mid"></el-option>
                <el-option label="困难" value="High"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-select v-model="choiceProblem.category" placeholder="选择分类" clearable>
                <el-option
                  v-for="category in categoryList"
                  :key="category.id"
                  :label="category.full_path || category.name"
                  :value="category.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="答案解析">
              <Simditor v-model="choiceProblem.explanation"></Simditor>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select
                v-model="choiceProblem.tags"
                multiple
                filterable
                allow-create
                placeholder="选择或创建标签">
                <el-option
                  v-for="tag in tagList"
                  :key="tag.name"
                  :label="tag.name"
                  :value="tag.name">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可见性">
              <el-switch
                v-model="choiceProblem.visible"
                active-text="可见"
                inactive-text="隐藏">
              </el-switch>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="save">
          <el-button type="primary" @click="submit" :loading="submitting">{{mode === 'edit' ? '更新' : '创建'}}</el-button>
        </div>
      </el-form>
    </Panel>
  </div>
</template>

<script>
import api from '../../api.js'
import Simditor from '../../components/Simditor.vue'

const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F']

export default {
  name: 'ChoiceProblem',
  components: {
    Simditor
  },
  data () {
    return {
      title: '创建选择题',
      choiceProblem: {
        _id: '',
        title: '',
        description: '',
        options: [
          {key: 'A', value: ''},
          {key: 'B', value: ''},
          {key: 'C', value: ''},
          {key: 'D', value: ''}
        ],
        correct_answer: '',
        explanation: '',
        difficulty: 'Low',
        tags: [],
        visible: true,
        category: null
      },
      tagList: [],
      categoryList: [],
      submitting: false,
      mode: 'create',
      ruleValidate: {
        _id: [
          {required: true, message: '显示ID不能为空', trigger: 'blur'}
        ],
        title: [
          {required: true, message: '标题不能为空', trigger: 'blur'}
        ],
        description: [
          {required: true, message: '题目描述不能为空', trigger: 'blur'}
        ],
        correct_answer: [
          {required: true, message: '必须选择正确答案', trigger: 'change'}
        ]
      }
    }
  },
  mounted () {
    this.getTagList()
    this.getCategoryList()
    if (this.$route.name === 'edit-choice-problem') {
      this.title = '编辑选择题'
      this.mode = 'edit'
      this.getChoiceProblem(this.$route.params.problemId)
    }
  },
  methods: {
    submit () {
      this.$refs['formChoiceProblem'].validate((valid) => {
        if (!valid) {
          this.$error('请检查表单')
          return
        }
        
        // 验证选项
        for (let option of this.choiceProblem.options) {
          if (!option.value.trim()) {
            this.$error('所有选项都必须填写')
            return
          }
        }
        
        this.submitting = true
        let funcName = this.mode === 'edit' ? 'editChoiceProblem' : 'createChoiceProblem'
        api[funcName](this.choiceProblem).then(res => {
          this.submitting = false
          this.$success(this.mode === 'edit' ? '选择题更新成功' : '选择题创建成功')
          this.$router.push({name: 'choice-problem-list'})
        }).catch(() => {
          this.submitting = false
        })
      })
    },
    getChoiceProblem (problemId) {
      api.getChoiceProblem(problemId).then(res => {
        let problem = res.data.data
        this.choiceProblem = {
          id: problem.id,
          _id: problem._id,
          title: problem.title,
          description: problem.description,
          options: problem.options,
          correct_answer: problem.correct_answer,
          explanation: problem.explanation || '',
          difficulty: problem.difficulty,
          tags: problem.tags,
          visible: problem.visible,
          category: problem.category
        }
      })
    },
    getTagList () {
      api.getProblemTagList().then(res => {
        this.tagList = res.data.data
      })
    },
    getCategoryList () {
      api.getCategoryList().then(res => {
        this.categoryList = res.data.data
      })
    },
    addOption () {
      if (this.choiceProblem.options.length < 6) {
        let nextKey = optionKeys[this.choiceProblem.options.length]
        this.choiceProblem.options.push({
          key: nextKey,
          value: ''
        })
      }
    },
    deleteOption (index) {
      if (this.choiceProblem.options.length > 2) {
        let deletedKey = this.choiceProblem.options[index].key
        this.choiceProblem.options.splice(index, 1)
        
        // 重新分配选项键值
        this.choiceProblem.options.forEach((option, idx) => {
          option.key = optionKeys[idx]
        })
        
        // 如果删除的是正确答案，清空正确答案
        if (this.choiceProblem.correct_answer === deletedKey) {
          this.choiceProblem.correct_answer = ''
        }
      }
    }
  }
}
</script>

<style scoped>
.choice-option {
  margin-bottom: 10px;
}

.save {
  text-align: center;
  margin-top: 20px;
}
</style>