<template>
  <div class="view">
    <Panel title="选择题列表">
      <div slot="header">
        <el-input v-model="keyword" prefix-icon="el-icon-search" placeholder="关键词"></el-input>
      </div>
      <el-table v-loading="loading" :data="list" style="width: 100%" @row-dblclick="handleDblclick" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column width="100" prop="id" label="ID"></el-table-column>
        <el-table-column prop="title" label="标题">
          <template slot-scope="{row}">
            <div v-show="!row.isEditing" class="title-cell clickable" @click="goEdit(row.id)">{{ row.title }}</div>
            <el-input v-show="row.isEditing" v-model="row.title" placeholder="标题" @keyup.enter.native="handleInlineEdit(row)"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="120"></el-table-column>
        <el-table-column prop="is_public" label="可见性" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_public ? 'success' : 'info'" size="small">
              {{ scope.row.is_public ? '公开' : '私有' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column width="200" prop="create_time" label="创建时间">
          <template slot-scope="scope">{{ scope.row.create_time | localtime }}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="260">
          <div slot-scope="scope">
            <icon-btn name="编辑" icon="edit" @click.native="goEdit(scope.row.id)"></icon-btn>
            <icon-btn icon="trash" name="删除" @click.native="deleteItem(scope.row.id)"></icon-btn>
          </div>
        </el-table-column>
      </el-table>
      <div class="panel-options">
        <div class="left-buttons">
          <el-button type="primary" size="small" @click="goCreate" icon="el-icon-plus">新建</el-button>
          <el-button type="warning" size="small" @click="seedSamples" icon="el-icon-fa-magic">生成示例数据</el-button>
          <el-button type="success" size="small" @click="batchSetVisible(true)" :disabled="selectedItems.length === 0" icon="el-icon-view">批量设为公开</el-button>
          <el-button type="info" size="small" @click="batchSetVisible(false)" :disabled="selectedItems.length === 0" icon="el-icon-hide">批量设为私有</el-button>
        </div>
        <el-pagination class="page" layout="prev, pager, next" @current-change="currentChange" :page-size="pageSize" :total="total"></el-pagination>
      </div>
    </Panel>
    <el-dialog title="确认更新" width="20%" :visible.sync="inlineEditDialogVisible" @close-on-click-modal="false">
      <div>
        <p>标题：{{ currentRow.title }}</p>
      </div>
      <span slot="footer">
        <cancel @click.native="inlineEditDialogVisible = false; getList(currentPage)"></cancel>
        <save @click.native="updateItem(currentRow)"></save>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from '../../api.js'
import utils from '@/utils/utils'
import IconBtn from '../../components/btn/IconBtn.vue'
import Save from '../../components/btn/Save.vue'
import Cancel from '../../components/btn/Cancel.vue'

export default {
  name: 'ChoiceList',
  components: { IconBtn, Save, Cancel },
  data () {
    return {
      pageSize: 10,
      total: 0,
      list: [],
      keyword: '',
      loading: false,
      currentPage: 1,
      inlineEditDialogVisible: false,
      currentRow: {},
      selectedItems: []
    }
  },
  mounted () {
    this.getList(this.currentPage)
  },
  methods: {
    handleDblclick (row) {
      row.isEditing = true
    },
    goEdit (id) {
      this.$router.push({ name: 'edit-choice', params: { choiceId: id } })
    },
    goCreate () {
      this.$router.push({ name: 'create-choice' })
    },
    currentChange (page) {
      this.currentPage = page
      this.getList(page)
    },
    getList (page = 1) {
      this.loading = true
      api.getChoiceList((page - 1) * this.pageSize, this.pageSize, this.keyword).then(res => {
        this.loading = false
        const data = res.data.data
        this.total = data.total || 0
        const results = data.results || []
        for (let item of results) item.isEditing = false
        this.list = results
      }, () => {
        this.loading = false
      })
    },
    deleteItem (id) {
      this.$confirm('确认删除该选择题？', '删除选择题', { type: 'warning' }).then(() => {
        api.deleteChoice(id).then(() => this.getList(this.currentPage)).catch(() => {})
      }, () => {})
    },
    updateItem (row) {
      const data = Object.assign({}, row)
      api.editChoice(data).then(() => {
        this.inlineEditDialogVisible = false
        this.getList(this.currentPage)
      }).catch(() => { this.inlineEditDialogVisible = false })
    },
    handleInlineEdit (row) {
      this.currentRow = row
      this.inlineEditDialogVisible = true
    },
    seedSamples () {
      const samples = [
        { title: '两数之和（单选）', difficulty: 'Low', options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'], answers: [0], tags: ['数组'], multiple: false },
        { title: '素数判断（多选）', difficulty: 'Mid', options: ['2', '3', '4', '5'], answers: [0,1,3], tags: ['数学'], multiple: true }
      ]
      Promise.all(samples.map(s => api.createChoice(s))).then(() => this.getList(1)).catch(() => {})
    },
    handleSelectionChange (selection) {
      this.selectedItems = selection
    },
    batchSetVisible (isPublic) {
      if (this.selectedItems.length === 0) return
      const action = isPublic ? '设为公开' : '设为私有'
      this.$confirm(`确认将选中的 ${this.selectedItems.length} 个选择题${action}？`, `批量${action}`, { type: 'warning' }).then(() => {
        const promises = this.selectedItems.map(item => {
          const data = Object.assign({}, item, { is_public: isPublic })
          return api.editChoice(data)
        })
        Promise.all(promises).then(() => {
          this.$message.success(`批量${action}成功`)
          this.getList(this.currentPage)
          this.selectedItems = []
        }).catch(() => {
          this.$message.error(`批量${action}失败`)
        })
      }, () => {})
    }
  }
}
</script>

<style scoped>
.view { width: 100%; }
.panel-options { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.left-buttons { display: flex; gap: 8px; }
.page { margin-left: auto; }
.title-cell { line-height: 1.6; }
.clickable { cursor: pointer; color: #409EFF; }
.clickable:hover { text-decoration: underline; }
</style>