#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
选择题答案验证修复测试脚本
测试修复后的前端答案验证逻辑
"""

import requests
import json
import time

def test_answer_validation():
    """测试答案验证功能"""
    base_url = "http://localhost:8082"
    api_url = f"{base_url}/api/admin/choice"
    
    print("=== 选择题答案验证修复测试 ===")
    print(f"测试API: {api_url}")
    print()
    
    # 测试用例1: 单选题没有选择正确答案
    test_case_1 = {
        "title": "测试单选题（无正确答案）",
        "description": "这是一个测试单选题",
        "explanation": "测试解析",
        "difficulty": "Low",
        "multiple": False,
        "is_public": True,
        "categories": [],
        "tag_ids": [],
        "options": ["选项A", "选项B", "选项C"],
        "answer": None  # 没有正确答案
    }
    
    # 测试用例2: 多选题没有选择正确答案
    test_case_2 = {
        "title": "测试多选题（无正确答案）",
        "description": "这是一个测试多选题",
        "explanation": "测试解析",
        "difficulty": "Mid",
        "multiple": True,
        "is_public": True,
        "categories": [],
        "tag_ids": [],
        "options": ["选项A", "选项B", "选项C"],
        "answer": []  # 空的正确答案数组
    }
    
    # 测试用例3: 单选题有正确答案
    test_case_3 = {
        "title": "测试单选题（有正确答案）",
        "description": "这是一个测试单选题",
        "explanation": "测试解析",
        "difficulty": "Low",
        "multiple": False,
        "is_public": True,
        "categories": [],
        "tag_ids": [],
        "options": ["选项A", "选项B", "选项C"],
        "answer": 1  # 第一个选项为正确答案
    }
    
    # 测试用例4: 多选题有正确答案
    test_case_4 = {
        "title": "测试多选题（有正确答案）",
        "description": "这是一个测试多选题",
        "explanation": "测试解析",
        "difficulty": "Mid",
        "multiple": True,
        "is_public": True,
        "categories": [],
        "tag_ids": [],
        "options": ["选项A", "选项B", "选项C"],
        "answer": [1, 2]  # 第一和第二个选项为正确答案
    }
    
    test_cases = [
        ("单选题无正确答案", test_case_1, False),
        ("多选题无正确答案", test_case_2, False),
        ("单选题有正确答案", test_case_3, True),
        ("多选题有正确答案", test_case_4, True)
    ]
    
    results = []
    
    for name, test_case, should_succeed in test_cases:
        print(f"测试: {name}")
        print(f"预期结果: {'成功' if should_succeed else '失败（需要答案）'}")
        
        try:
            response = requests.post(
                api_url,
                json=test_case,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"HTTP状态码: {response.status_code}")
            
            if response.status_code == 200:
                result_data = response.json()
                print(f"响应: {json.dumps(result_data, ensure_ascii=False, indent=2)}")
                actual_success = 'error' not in result_data
            else:
                print(f"响应: {response.text}")
                actual_success = False
            
            # 验证结果
            if should_succeed == actual_success:
                print("✅ 测试通过")
                results.append((name, True, "符合预期"))
            else:
                expected = "成功" if should_succeed else "失败"
                actual = "成功" if actual_success else "失败"
                print(f"❌ 测试失败 - 预期: {expected}, 实际: {actual}")
                results.append((name, False, f"预期{expected}但实际{actual}"))
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 请求失败: {e}")
            results.append((name, False, f"请求异常: {e}"))
        except Exception as e:
            print(f"❌ 测试异常: {e}")
            results.append((name, False, f"测试异常: {e}"))
        
        print("-" * 50)
        time.sleep(1)
    
    # 汇总结果
    print("\n=== 测试结果汇总 ===")
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for name, success, message in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{status} {name}: {message}")
    
    print(f"\n总计: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("🎉 所有答案验证测试均通过！")
        return True
    else:
        print("⚠️  部分测试失败，需要进一步检查")
        return False

if __name__ == "__main__":
    success = test_answer_validation()
    exit(0 if success else 1)