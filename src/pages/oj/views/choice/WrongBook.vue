<template>
  <div class="wrong-book">
    <Card>
      <div slot="title">
        <Icon type="ios-book" />
        错题本
        <span class="total-count" v-if="total > 0">({{ total }}题)</span>
      </div>
      
      <!-- 筛选区域 -->
      <div class="filter-section">
        <Row :gutter="16">
          <Col span="8">
            <Input v-model="keyword" placeholder="搜索题目标题" @on-enter="getWrongChoices" clearable>
              <Icon type="ios-search" slot="prefix" />
            </Input>
          </Col>
          <Col span="6">
            <Select v-model="resolvedFilter" placeholder="掌握状态" @on-change="getWrongChoices">
              <Option value="">全部</Option>
              <Option value="false">未掌握</Option>
              <Option value="true">已掌握</Option>
            </Select>
          </Col>
          <Col span="6">
            <Select v-model="difficultyFilter" placeholder="难度筛选" @on-change="getWrongChoices">
              <Option value="">全部难度</Option>
              <Option value="Low">简单</Option>
              <Option value="Mid">中等</Option>
              <Option value="High">困难</Option>
            </Select>
          </Col>
          <Col span="4">
            <Button type="primary" @click="getWrongChoices">搜索</Button>
          </Col>
        </Row>
      </div>
      
      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedWrongChoices.length > 0">
        <Alert show-icon>
          已选择 {{ selectedWrongChoices.length }} 道题目
          <template slot="desc">
            <Button type="primary" size="small" @click="batchPractice">批量重练</Button>
            <Button type="success" size="small" @click="batchMarkResolved">批量标记掌握</Button>
            <Button type="error" size="small" @click="batchDelete">批量删除</Button>
          </template>
        </Alert>
      </div>
      
      <!-- 错题列表 -->
      <Table 
        :columns="columns" 
        :data="wrongChoices" 
        :loading="loading"
        @on-selection-change="onSelectionChange"
        stripe
      >
        <template slot-scope="{ row }" slot="title">
          <a @click="goChoice(row)" class="choice-title">{{ row.choice_title }}</a>
        </template>
        
        <template slot-scope="{ row }" slot="difficulty">
          <Tag :color="getDifficultyColor(row.choice_difficulty)">{{ row.choice_difficulty }}</Tag>
        </template>
        
        <template slot-scope="{ row }" slot="wrong_count">
          <Badge :count="row.wrong_count" :overflow-count="99">
            <Icon type="ios-close-circle" color="#ed4014" />
          </Badge>
        </template>
        
        <template slot-scope="{ row }" slot="last_wrong_at">
          {{ formatTime(row.last_wrong_at) }}
        </template>
        
        <template slot-scope="{ row }" slot="resolved">
          <Tag :color="row.resolved_at ? 'green' : 'orange'">
            {{ row.resolved_at ? '已掌握' : '未掌握' }}
          </Tag>
        </template>
        
        <template slot-scope="{ row }" slot="note">
          <div class="note-cell">
            <span v-if="!row.editing" @click="editNote(row)" class="note-content">
              {{ row.note || '点击添加笔记' }}
            </span>
            <Input 
              v-else 
              v-model="row.tempNote" 
              @on-blur="saveNote(row)"
              @on-enter="saveNote(row)"
              placeholder="添加笔记"
              size="small"
            />
          </div>
        </template>
        
        <template slot-scope="{ row }" slot="actions">
          <Button type="primary" size="small" @click="practiceChoice(row)">重练</Button>
          <Button 
            :type="row.resolved_at ? 'default' : 'success'" 
            size="small" 
            @click="toggleResolved(row)"
          >
            {{ row.resolved_at ? '标记未掌握' : '标记掌握' }}
          </Button>
          <Button type="error" size="small" @click="deleteWrongChoice(row)">删除</Button>
        </template>
      </Table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <Page 
          :total="total" 
          :current="page" 
          :page-size="limit"
          @on-change="handlePageChange"
          show-total
          show-sizer
          @on-page-size-change="handlePageSizeChange"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-if="!loading && wrongChoices.length === 0" class="empty-state">
        <Icon type="ios-book" size="64" color="#c5c8ce" />
        <p>暂无错题记录</p>
        <Button type="primary" @click="goChoiceList">去刷题</Button>
      </div>
    </Card>
  </div>
</template>

<script>
import api from '@oj/api'
import time from '@/utils/time'

export default {
  name: 'WrongBook',
  data () {
    return {
      wrongChoices: [],
      selectedWrongChoices: [],
      loading: false,
      total: 0,
      page: 1,
      limit: 20,
      keyword: '',
      resolvedFilter: '',
      difficultyFilter: '',
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: '题目',
          slot: 'title',
          minWidth: 200
        },
        {
          title: '难度',
          slot: 'difficulty',
          width: 100,
          align: 'center'
        },
        {
          title: '错误次数',
          slot: 'wrong_count',
          width: 100,
          align: 'center'
        },
        {
          title: '最近错误时间',
          slot: 'last_wrong_at',
          width: 150,
          align: 'center'
        },
        {
          title: '掌握状态',
          slot: 'resolved',
          width: 100,
          align: 'center'
        },
        {
          title: '笔记',
          slot: 'note',
          minWidth: 150
        },
        {
          title: '操作',
          slot: 'actions',
          width: 200,
          align: 'center'
        }
      ]
    }
  },
  mounted () {
    this.getWrongChoices()
  },
  methods: {
    async getWrongChoices (page = 1) {
      this.loading = true
      try {
        const params = {
          offset: (page - 1) * this.limit,
          limit: this.limit
        }
        
        if (this.keyword) {
          params.keyword = this.keyword
        }
        
        if (this.resolvedFilter !== '') {
          params.resolved = this.resolvedFilter
        }
        
        const res = await api.getWrongChoices(params)
        this.wrongChoices = res.data.data.results.map(item => ({
          ...item,
          editing: false,
          tempNote: item.note || ''
        }))
        this.total = res.data.data.total
      } catch (error) {
        this.$error('获取错题列表失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    
    onSelectionChange (selection) {
      this.selectedWrongChoices = selection
    },
    
    editNote (row) {
      row.editing = true
      row.tempNote = row.note || ''
      this.$nextTick(() => {
        // 聚焦到输入框
        const input = this.$el.querySelector('.note-cell input')
        if (input) input.focus()
      })
    },
    
    async saveNote (row) {
      if (row.tempNote === row.note) {
        row.editing = false
        return
      }
      
      try {
        await api.updateWrongChoice(row.id, { note: row.tempNote })
        row.note = row.tempNote
        row.editing = false
        this.$success('笔记保存成功')
      } catch (error) {
        this.$error('保存笔记失败')
        console.error(error)
      }
    },
    
    async toggleResolved (row) {
      try {
        const resolved = !row.resolved_at
        await api.updateWrongChoice(row.id, { resolved })
        
        if (resolved) {
          row.resolved_at = new Date().toISOString()
          this.$success('已标记为掌握')
        } else {
          row.resolved_at = null
          this.$success('已标记为未掌握')
        }
      } catch (error) {
        this.$error('更新状态失败')
        console.error(error)
      }
    },
    
    async deleteWrongChoice (row) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除错题"${row.choice_title}"吗？`,
        onOk: async () => {
          try {
            await api.deleteWrongChoice(row.id)
            this.$success('删除成功')
            this.getWrongChoices(this.page)
          } catch (error) {
            this.$error('删除失败')
            console.error(error)
          }
        }
      })
    },
    
    practiceChoice (row) {
      this.$router.push({
        name: 'choice-details',
        params: { choiceID: row.choice_id }
      })
    },
    
    batchPractice () {
      const choiceIds = this.selectedWrongChoices.map(item => item.choice_id)
      this.$router.push({
        name: 'choice-practice',
        query: { ids: choiceIds.join(',') }
      })
    },
    
    async batchMarkResolved () {
      this.$Modal.confirm({
        title: '批量标记掌握',
        content: `确定要将选中的 ${this.selectedWrongChoices.length} 道题目标记为已掌握吗？`,
        onOk: async () => {
          try {
            const promises = this.selectedWrongChoices.map(item => 
              api.updateWrongChoice(item.id, { resolved: true })
            )
            await Promise.all(promises)
            this.$success('批量标记成功')
            this.getWrongChoices(this.page)
          } catch (error) {
            this.$error('批量标记失败')
            console.error(error)
          }
        }
      })
    },
    
    async batchDelete () {
      this.$Modal.confirm({
        title: '批量删除',
        content: `确定要删除选中的 ${this.selectedWrongChoices.length} 道错题吗？此操作不可恢复。`,
        onOk: async () => {
          try {
            const promises = this.selectedWrongChoices.map(item => 
              api.deleteWrongChoice(item.id)
            )
            await Promise.all(promises)
            this.$success('批量删除成功')
            this.getWrongChoices(this.page)
          } catch (error) {
            this.$error('批量删除失败')
            console.error(error)
          }
        }
      })
    },
    
    handlePageChange (page) {
      this.page = page
      this.getWrongChoices(page)
    },
    
    handlePageSizeChange (pageSize) {
      this.limit = pageSize
      this.page = 1
      this.getWrongChoices(1)
    },
    
    goChoice (row) {
      this.$router.push({
        name: 'choice-details',
        params: { choiceID: row.choice_id }
      })
    },
    
    goChoiceList () {
      this.$router.push({ name: 'choice-list' })
    },
    
    getDifficultyColor (difficulty) {
      const colorMap = {
        'Low': 'green',
        'Mid': 'orange',
        'High': 'red'
      }
      return colorMap[difficulty] || 'default'
    },
    
    formatTime (timeStr) {
      return time.utcToLocal(timeStr, 'YYYY-MM-DD HH:mm')
    }
  }
}
</script>

<style scoped>
.wrong-book {
  padding: 20px;
}

.total-count {
  color: #999;
  font-size: 14px;
  margin-left: 10px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 4px;
}

.batch-actions {
  margin-bottom: 16px;
}

.batch-actions .ivu-btn {
  margin-left: 8px;
}

.choice-title {
  color: #2d8cf0;
  cursor: pointer;
  text-decoration: none;
}

.choice-title:hover {
  text-decoration: underline;
}

.note-cell {
  min-height: 20px;
}

.note-content {
  cursor: pointer;
  color: #666;
  font-style: italic;
}

.note-content:hover {
  color: #2d8cf0;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 20px 0;
  font-size: 16px;
}

.ivu-table-cell {
  padding: 12px 8px;
}

.ivu-btn + .ivu-btn {
  margin-left: 8px;
}
</style>