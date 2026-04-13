#!/usr/bin/env python3
"""
NeuraFinance Backend API Testing
Tests all backend endpoints for the DeFi platform
"""

import requests
import sys
import json
from datetime import datetime

class NeuraFinanceAPITester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.content else {}

        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection Error: Could not connect to {url}")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': 'Connection Error'
            })
            return False, {}
        except requests.exceptions.Timeout:
            print(f"❌ Failed - Timeout: Request timed out")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': 'Timeout'
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'endpoint': endpoint,
                'error': str(e)
            })
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/health",
            200
        )
        if success:
            print(f"   Mode: {response.get('mode', 'unknown')}")
            print(f"   Status: {response.get('status', 'unknown')}")
        return success

    def test_dashboard_endpoint(self):
        """Test dashboard aggregate endpoint"""
        success, response = self.run_test(
            "Dashboard Data",
            "GET",
            "/api/dashboard",
            200
        )
        if success:
            required_fields = ['totalSupply', 'totalStaked', 'tvl', 'tokenPrice', 'marketCap']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   ✅ All required fields present")
                print(f"   Market Cap: ${response.get('marketCap', 'N/A')}")
                print(f"   TVL: ${response.get('tvl', 'N/A')}")
        return success

    def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        success, response = self.run_test(
            "System Metrics",
            "GET",
            "/api/metrics",
            200
        )
        if success:
            print(f"   Total Supply: {response.get('totalSupply', 'N/A')}")
            print(f"   Health Score: {response.get('healthScore', 'N/A')}")
        return success

    def test_price_endpoint(self):
        """Test price endpoint"""
        success, response = self.run_test(
            "Token Price",
            "GET",
            "/api/price",
            200
        )
        if success:
            print(f"   Price: ${response.get('price', 'N/A')}")
            print(f"   Stable: {response.get('isStable', 'N/A')}")
        return success

    def test_treasury_endpoint(self):
        """Test treasury endpoint"""
        success, response = self.run_test(
            "Treasury Data",
            "GET",
            "/api/treasury",
            200
        )
        if success:
            print(f"   TVL: {response.get('tvl', 'N/A')}")
        return success

    def test_staking_endpoint(self):
        """Test staking endpoint"""
        success, response = self.run_test(
            "Staking Data",
            "GET",
            "/api/staking",
            200
        )
        if success:
            print(f"   Total Staked: {response.get('totalStaked', 'N/A')}")
            print(f"   Staking Ratio: {response.get('stakingRatio', 'N/A')}%")
        return success

def main():
    print("🚀 Starting NeuraFinance Backend API Tests")
    print("=" * 50)
    
    # Test with localhost first
    tester = NeuraFinanceAPITester("http://localhost:3001")
    
    # Run all tests
    tests = [
        tester.test_health_endpoint,
        tester.test_dashboard_endpoint,
        tester.test_metrics_endpoint,
        tester.test_price_endpoint,
        tester.test_treasury_endpoint,
        tester.test_staking_endpoint,
    ]
    
    for test in tests:
        test()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in tester.failed_tests:
            error_msg = test.get('error', f'Status {test.get("actual", "unknown")}')
            print(f"  - {test['name']}: {error_msg}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())