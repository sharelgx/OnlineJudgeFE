<template>
  <div>
    <panel>
      <div slot="title">选择题统计</div>
      <div class="container">
        <!-- 总体统计 -->
        <el-row :gutter="20" class="mb-4">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overallStats.totalProblems }}</div>
                <div class="stat-label">总题目数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overallStats.totalSubmissions }}</div>
                <div class="stat-label">总提交数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overallStats.totalUsers }}</div>
                <div class="stat-label">活跃用户数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ overallStats.averageAccuracy }}%</div>
                <div class="stat-label">平均正确率</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 难度分布 -->
        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <el-card>
              <div slot="header">难度分布</div>
              <div ref="difficultyChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <div slot="header">正确率分布</div>
              <div ref="accuracyChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 提交趋势 -->
        <el-row :gutter="20" class="mb-4">
          <el-col :span="24">
            <el-card>
              <div slot="header">
                <span>提交趋势</span>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  align="right"
                  size="small"
                  style="float: right; margin-top: -5px;"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期">
                </el-date-picker>
              </div>
              <div ref="trendChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 热门题目 & 用户排行 -->
        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <el-card>
              <div slot="header">热门题目</div>
              <el-table :data="popularProblems" size="small" stripe>
                <el-table-column prop="title" label="题目" width="180">
                  <template slot-scope="scope">
                    <el-button type="text" @click="showProblemAnalysis(scope.row.id)">
                      {{ scope.row.title }}
                    </el-button>
                  </template>
                </el-table-column>
                <el-table-column prop="submission_count" label="提交数" width="80"></el-table-column>
                <el-table-column prop="accuracy" label="正确率">
                  <template slot-scope="scope">
                    <el-tag :type="getAccuracyColor(scope.row.accuracy)" size="small">
                      {{ scope.row.accuracy }}%
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <div slot="header">用户排行</div>
              <el-table :data="topUsers" size="small" stripe>
                <el-table-column prop="rank" label="排名" width="60">
                  <template slot-scope="scope">
                    <el-tag :type="getRankColor(scope.row.rank)" size="small" v-if="scope.row.rank <= 3">
                      {{ scope.row.rank }}
                    </el-tag>
                    <span v-else>{{ scope.row.rank }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="username" label="用户名" width="120"></el-table-column>
                <el-table-column prop="correct_count" label="正确数" width="80"></el-table-column>
                <el-table-column prop="accuracy" label="正确率">
                  <template slot-scope="scope">
                    <el-tag :type="getAccuracyColor(scope.row.accuracy)" size="small">
                      {{ scope.row.accuracy }}%
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 标签统计 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <div slot="header">标签统计</div>
              <div class="tag-cloud">
                <el-tag
                  v-for="tag in tagStats"
                  :key="tag.name"
                  :style="getTagStyle(tag.count)"
                  class="tag-item"
                  @click="filterByTag(tag.name)">
                  {{ tag.name }} ({{ tag.count }})
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </panel>
    
    <!-- 题目详细分析对话框 -->
    <el-dialog
      title="题目分析"
      :visible.sync="analysisDialogVisible"
      width="70%">
      <div v-loading="loadingAnalysis">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="提交记录" name="submissions">
            <el-table :data="problemAnalysis.submissions" size="small" stripe>
              <el-table-column prop="username" label="用户名" width="120"></el-table-column>
              <el-table-column prop="is_correct" label="结果" width="80">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.is_correct ? 'success' : 'danger'" size="small">
                    {{ scope.row.is_correct ? '正确' : '错误' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="submit_time" label="提交时间">
                <template slot-scope="scope">
                  {{ scope.row.submit_time | localtime }}
                </template>
              </el-table-column>
              <el-table-column prop="selected_option" label="选择" width="80"></el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="选项分析" name="options">
            <div ref="optionChart" style="height: 400px;"></div>
          </el-tab-pane>
          <el-tab-pane label="时间分析" name="time">
            <div ref="timeChart" style="height: 400px;"></div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import api from '@admin/api'
import echarts from 'echarts'

export default {
  name: 'ChoiceStatistics',
  data () {
    return {
      overallStats: {
        totalProblems: 0,
        totalSubmissions: 0,
        totalUsers: 0,
        averageAccuracy: 0
      },
      popularProblems: [],
      topUsers: [],
      tagStats: [],
      dateRange: [],
      analysisDialogVisible: false,
      activeTab: 'submissions',
      problemAnalysis: {
        submissions: []
      },
      loadingAnalysis: false,
      difficultyChart: null,
      accuracyChart: null,
      trendChart: null,
      optionChart: null,
      timeChart: null
    }
  },
  mounted () {
    this.loadStatistics()
    this.initCharts()
  },
  beforeDestroy () {
    if (this.difficultyChart) this.difficultyChart.dispose()
    if (this.accuracyChart) this.accuracyChart.dispose()
    if (this.trendChart) this.trendChart.dispose()
    if (this.optionChart) this.optionChart.dispose()
    if (this.timeChart) this.timeChart.dispose()
  },
  methods: {
    async loadStatistics () {
      try {
        // 加载总体统计
        const overallRes = await api.getChoiceStatistics()
        this.overallStats = overallRes.data.data
        
        // 加载热门题目
        const popularRes = await api.getPopularChoiceProblems()
        this.popularProblems = popularRes.data.data
        
        // 加载用户排行
        const usersRes = await api.getTopChoiceUsers()
        this.topUsers = usersRes.data.data
        
        // 加载标签统计
        const tagsRes = await api.getChoiceTagStats()
        this.tagStats = tagsRes.data.data
        
        this.updateCharts()
      } catch (error) {
        this.$error('Failed to load statistics')
      }
    },
    initCharts () {
      this.difficultyChart = echarts.init(this.$refs.difficultyChart)
      this.accuracyChart = echarts.init(this.$refs.accuracyChart)
      this.trendChart = echarts.init(this.$refs.trendChart)
    },
    updateCharts () {
      this.updateDifficultyChart()
      this.updateAccuracyChart()
      this.updateTrendChart()
    },
    updateDifficultyChart () {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['Low', 'Mid', 'High']
        },
        series: [
          {
            name: 'Difficulty',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '30',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: (this.overallStats.difficultyStats && this.overallStats.difficultyStats.Low) || 0, name: 'Low', itemStyle: { color: '#67C23A' } },
              { value: (this.overallStats.difficultyStats && this.overallStats.difficultyStats.Mid) || 0, name: 'Mid', itemStyle: { color: '#E6A23C' } },
              { value: (this.overallStats.difficultyStats && this.overallStats.difficultyStats.High) || 0, name: 'High', itemStyle: { color: '#F56C6C' } }
            ]
          }
        ]
      }
      this.difficultyChart.setOption(option)
    },
    updateAccuracyChart () {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Problems',
            type: 'bar',
            data: this.overallStats.accuracyDistribution || [0, 0, 0, 0, 0],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      }
      this.accuracyChart.setOption(option)
    },
    updateTrendChart () {
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Submissions', 'Correct Submissions']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: (this.overallStats.trendData && this.overallStats.trendData.dates) || []
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Submissions',
            type: 'line',
            stack: 'Total',
            data: (this.overallStats.trendData && this.overallStats.trendData.submissions) || []
          },
          {
            name: 'Correct Submissions',
            type: 'line',
            stack: 'Total',
            data: (this.overallStats.trendData && this.overallStats.trendData.correct) || []
          }
        ]
      }
      this.trendChart.setOption(option)
    },
    getAccuracyColor (accuracy) {
      if (accuracy >= 80) return 'success'
      if (accuracy >= 60) return 'warning'
      return 'danger'
    },
    getRankColor (rank) {
      const colors = ['', 'danger', 'warning', 'success']
      return colors[rank] || 'info'
    },
    getTagStyle (count) {
      const maxCount = Math.max(...this.tagStats.map(t => t.count))
      const ratio = count / maxCount
      const fontSize = 12 + ratio * 8
      const opacity = 0.6 + ratio * 0.4
      return {
        fontSize: fontSize + 'px',
        opacity: opacity
      }
    },
    filterByTag (tagName) {
      this.$router.push({
        name: 'choice-problem-list',
        query: { tag: tagName }
      })
    },
    async showProblemAnalysis (problemId) {
      this.analysisDialogVisible = true
      this.loadingAnalysis = true
      try {
        const res = await api.getChoiceProblemAnalysis(problemId)
        this.problemAnalysis = res.data.data
        this.$nextTick(() => {
          this.initAnalysisCharts()
        })
      } catch (error) {
        this.$error('Failed to load problem analysis')
      } finally {
        this.loadingAnalysis = false
      }
    },
    initAnalysisCharts () {
      if (this.$refs.optionChart) {
        this.optionChart = echarts.init(this.$refs.optionChart)
        this.updateOptionChart()
      }
      if (this.$refs.timeChart) {
        this.timeChart = echarts.init(this.$refs.timeChart)
        this.updateTimeChart()
      }
    },
    updateOptionChart () {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10
        },
        series: [
          {
            name: 'Option Selection',
            type: 'pie',
            radius: '50%',
            data: this.problemAnalysis.optionStats || []
          }
        ]
      }
      this.optionChart.setOption(option)
    },
    updateTimeChart () {
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: (this.problemAnalysis.timeStats && this.problemAnalysis.timeStats.hours) || []
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Submissions',
            type: 'bar',
            data: (this.problemAnalysis.timeStats && this.problemAnalysis.timeStats.counts) || []
          }
        ]
      }
      this.timeChart.setOption(option)
    }
  }
}
</script>

<style scoped>
.stat-card {
  .stat-content {
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
  }
}

.tag-cloud {
  .tag-item {
    margin: 5px;
    cursor: pointer;
  }
}
</style>