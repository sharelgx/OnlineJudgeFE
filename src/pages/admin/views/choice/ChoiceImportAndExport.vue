<template>
  <div>
    <div style="padding-bottom: 10px;">
    </div>
    <panel title="Export Choice Problems">
      <div slot="header">
        <el-input
          v-model="keyword"
          prefix-icon="el-icon-search"
          placeholder="Keywords">
        </el-input>
      </div>
      <el-table :data="choiceProblems"
                v-loading="loadingProblems" @selection-change="handleSelectionChange">
        <el-table-column
          type="selection"
          width="60">
        </el-table-column>
        <el-table-column
          label="ID"
          width="100"
          prop="id">
        </el-table-column>
        <el-table-column
          label="DisplayID"
          width="200"
          prop="_id">
        </el-table-column>
        <el-table-column
          label="Title"
          prop="title">
        </el-table-column>
        <el-table-column
          prop="created_by.username"
          label="Author">
        </el-table-column>
        <el-table-column
          prop="create_time"
          label="Create Time">
          <template slot-scope="scope">
            {{scope.row.create_time | localtime }}
          </template>
        </el-table-column>
        <el-table-column
          label="Difficulty"
          width="120">
          <template slot-scope="scope">
            <el-tag :type="getDifficultyColor(scope.row.difficulty)" size="small">
              {{ getDifficultyText(scope.row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="panel-options">
        <el-button type="primary" size="small" v-show="selected_problems.length"
                   @click="exportChoiceProblems" icon="el-icon-fa-arrow-down">Export
        </el-button>
        <el-pagination
          class="page"
          layout="prev, pager, next"
          @current-change="getChoiceProblems"
          :page-size="limit"
          :total="total">
        </el-pagination>
      </div>
    </panel>
    
    <panel title="Import Choice Problems">
      <el-upload
        ref="choiceUpload"
        action="/api/admin/import_choice_problem"
        name="file"
        :file-list="fileList"
        :show-file-list="true"
        :with-credentials="true"
        :limit="1"
        :on-change="onFileChange"
        :auto-upload="false"
        :on-success="uploadSucceeded"
        :on-error="uploadFailed"
        accept=".json,.xlsx,.csv">
        <el-button size="small" type="primary" icon="el-icon-fa-upload" slot="trigger">Choose File</el-button>
        <el-button style="margin-left: 10px;" size="small" type="success" @click="submitUpload">Upload</el-button>
        <div slot="tip" class="el-upload__tip">
          Support JSON, Excel (.xlsx) and CSV formats. JSON format example:
          <pre style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">[
  {
    "title": "Sample Choice Question",
    "description": "What is 1+1?",
    "options": ["1", "2", "3", "4"],
    "correct_answer": 1,
    "explanation": "1+1 equals 2",
    "difficulty": "Low",
    "tags": ["math", "basic"]
  }
]</pre>
        </div>
      </el-upload>
    </panel>

    <panel title="Batch Operations">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover">
            <div slot="header">
              <span>Statistics</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Problems:</span>
              <span class="stat-value">{{ total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Selected:</span>
              <span class="stat-value">{{ selected_problems.length }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card shadow="hover">
            <div slot="header">
              <span>Batch Actions</span>
            </div>
            <el-button-group>
              <el-button type="warning" size="small" 
                         :disabled="!selected_problems.length"
                         @click="batchDelete"
                         icon="el-icon-delete">Delete Selected</el-button>
              <el-button type="info" size="small" 
                         :disabled="!selected_problems.length"
                         @click="batchUpdateDifficulty"
                         icon="el-icon-edit">Update Difficulty</el-button>
              <el-button type="success" size="small" 
                         :disabled="!selected_problems.length"
                         @click="batchAddTags"
                         icon="el-icon-price-tag">Add Tags</el-button>
            </el-button-group>
          </el-card>
        </el-col>
      </el-row>
    </panel>

    <!-- Batch Update Difficulty Dialog -->
    <el-dialog title="Update Difficulty" :visible.sync="difficultyDialogVisible" width="400px">
      <el-form>
        <el-form-item label="Difficulty">
          <el-select v-model="batchDifficulty" placeholder="Select difficulty">
            <el-option label="Low" value="Low"></el-option>
            <el-option label="Mid" value="Mid"></el-option>
            <el-option label="High" value="High"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="difficultyDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirmUpdateDifficulty">Confirm</el-button>
      </div>
    </el-dialog>

    <!-- Batch Add Tags Dialog -->
    <el-dialog title="Add Tags" :visible.sync="tagsDialogVisible" width="400px">
      <el-form>
        <el-form-item label="Tags">
          <el-input v-model="batchTags" placeholder="Enter tags separated by commas"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="tagsDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirmAddTags">Confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@admin/api'
import utils from '@/utils/utils'

export default {
  name: 'ChoiceImportAndExport',
  data () {
    return {
      fileList: [],
      page: 1,
      limit: 10,
      total: 0,
      loadingProblems: false,
      keyword: '',
      choiceProblems: [],
      selected_problems: [],
      difficultyDialogVisible: false,
      tagsDialogVisible: false,
      batchDifficulty: '',
      batchTags: ''
    }
  },
  mounted () {
    this.getChoiceProblems()
  },
  methods: {
    handleSelectionChange (val) {
      this.selected_problems = val
    },
    getChoiceProblems (page = 1) {
      let params = {
        keyword: this.keyword,
        offset: (page - 1) * this.limit,
        limit: this.limit
      }
      this.loadingProblems = true
      api.getChoiceProblemList(params).then(res => {
        this.choiceProblems = res.data.data.results
        this.total = res.data.data.total
        this.loadingProblems = false
      }).catch(() => {
        this.loadingProblems = false
      })
    },
    exportChoiceProblems () {
      let params = []
      for (let p of this.selected_problems) {
        params.push('problem_id=' + p.id)
      }
      let url = '/admin/export_choice_problem?' + params.join('&')
      utils.downloadFile(url)
    },
    submitUpload () {
      this.$refs.choiceUpload.submit()
    },
    onFileChange (file, fileList) {
      this.fileList = fileList.slice(-1)
    },
    uploadSucceeded (response) {
      if (response.error) {
        this.$error(response.data)
      } else {
        this.$success('Successfully imported ' + response.data.import_count + ' choice problems')
        this.getChoiceProblems()
      }
    },
    uploadFailed () {
      this.$error('Upload failed')
    },
    getDifficultyColor (difficulty) {
      const colorMap = {
        'Low': 'success',
        'Mid': 'warning', 
        'High': 'danger'
      }
      return colorMap[difficulty] || 'info'
    },
    getDifficultyText (difficulty) {
      return difficulty || 'Unknown'
    },
    batchDelete () {
      this.$confirm('Are you sure to delete selected choice problems?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        let promises = this.selected_problems.map(problem => 
          api.deleteChoiceProblem(problem.id)
        )
        Promise.all(promises).then(() => {
          this.$success('Batch delete successful')
          this.getChoiceProblems()
        }).catch(() => {
          this.$error('Batch delete failed')
        })
      })
    },
    batchUpdateDifficulty () {
      this.difficultyDialogVisible = true
    },
    confirmUpdateDifficulty () {
      if (!this.batchDifficulty) {
        this.$error('Please select difficulty')
        return
      }
      let promises = this.selected_problems.map(problem => {
        let data = { ...problem, difficulty: this.batchDifficulty }
        return api.editChoiceProblem(data)
      })
      Promise.all(promises).then(() => {
        this.$success('Batch update successful')
        this.difficultyDialogVisible = false
        this.batchDifficulty = ''
        this.getChoiceProblems()
      }).catch(() => {
        this.$error('Batch update failed')
      })
    },
    batchAddTags () {
      this.tagsDialogVisible = true
    },
    confirmAddTags () {
      if (!this.batchTags.trim()) {
        this.$error('Please enter tags')
        return
      }
      let newTags = this.batchTags.split(',').map(tag => tag.trim()).filter(tag => tag)
      let promises = this.selected_problems.map(problem => {
        let existingTags = problem.tags || []
        let updatedTags = [...new Set([...existingTags, ...newTags])]
        let data = { ...problem, tags: updatedTags }
        return api.editChoiceProblem(data)
      })
      Promise.all(promises).then(() => {
        this.$success('Batch add tags successful')
        this.tagsDialogVisible = false
        this.batchTags = ''
        this.getChoiceProblems()
      }).catch(() => {
        this.$error('Batch add tags failed')
      })
    }
  },
  watch: {
    'keyword' () {
      this.getChoiceProblems()
    }
  }
}
</script>

<style scoped lang="less">
.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  
  .stat-label {
    color: #666;
  }
  
  .stat-value {
    font-weight: bold;
    color: #409EFF;
  }
}

.el-upload__tip {
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}
</style>