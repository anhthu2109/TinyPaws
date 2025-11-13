/**
 * API Test Utility for TinyPaws Chatbot
 * 
 * Sử dụng:
 * 1. Import vào console: import { testAPI } from './api-test'
 * 2. Chạy: testAPI()
 * 3. Hoặc test specific: testConnection(), testChat("Hello")
 */

import axios from 'axios';

const API_URL = "http://localhost:8001/chat";
const HEALTH_URL = "http://localhost:8001/health"; // Nếu có

/**
 * Test connection đến FastAPI server
 */
export const testConnection = async () => {
  console.log("🔍 Testing connection to FastAPI server...");
  console.log(`📍 URL: ${API_URL}`);
  
  try {
    const response = await axios.get(HEALTH_URL, { timeout: 5000 });
    console.log("✅ Connection successful!");
    console.log("📊 Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Connection failed!");
    if (error.code === 'ECONNREFUSED') {
      console.error("💡 FastAPI server không chạy. Hãy start server:");
      console.error("   cd ChatbotServer");
      console.error("   uvicorn main:app --reload --port 8001");
    } else if (error.code === 'ERR_NETWORK') {
      console.error("💡 Network error. Kiểm tra:");
      console.error("   - Server có đang chạy không?");
      console.error("   - Port 8001 có bị block không?");
      console.error("   - CORS có được config không?");
    } else {
      console.error("💡 Error:", error.message);
    }
    return false;
  }
};

/**
 * Test gửi message đến chatbot
 */
export const testChat = async (message = "Xin chào") => {
  console.log("💬 Testing chat message...");
  console.log(`📝 Message: "${message}"`);
  
  const startTime = performance.now();
  
  try {
    const response = await axios.post(API_URL, 
      { message }, 
      { 
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.log("✅ Chat successful!");
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log("🤖 Bot response:", response.data.response);
    console.log("📊 Full response:", response.data);
    
    return response.data;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.error("❌ Chat failed!");
    console.error(`⏱️  Failed after: ${duration}ms`);
    
    if (error.response) {
      // Server responded with error
      console.error("📊 Status:", error.response.status);
      console.error("📊 Data:", error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("💡 No response from server");
      console.error("   - Server có đang chạy không?");
      console.error("   - Endpoint /chat có đúng không?");
    } else {
      console.error("💡 Error:", error.message);
    }
    
    return null;
  }
};

/**
 * Test multiple messages liên tiếp
 */
export const testMultipleMessages = async (messages = [
  "Chó của tôi bị tiêu chảy",
  "Mèo tôi không chịu ăn",
  "Làm sao để huấn luyện chó?"
]) => {
  console.log("🔄 Testing multiple messages...");
  console.log(`📝 ${messages.length} messages to send`);
  
  const results = [];
  
  for (let i = 0; i < messages.length; i++) {
    console.log(`\n--- Message ${i + 1}/${messages.length} ---`);
    const result = await testChat(messages[i]);
    results.push(result);
    
    // Wait 1s between messages
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("\n📊 Summary:");
  console.log(`✅ Successful: ${results.filter(r => r !== null).length}`);
  console.log(`❌ Failed: ${results.filter(r => r === null).length}`);
  
  return results;
};

/**
 * Test error handling
 */
export const testErrorHandling = async () => {
  console.log("🧪 Testing error handling...");
  
  // Test 1: Empty message
  console.log("\n--- Test 1: Empty message ---");
  await testChat("");
  
  // Test 2: Very long message
  console.log("\n--- Test 2: Very long message ---");
  const longMessage = "Chó ".repeat(1000);
  await testChat(longMessage);
  
  // Test 3: Special characters
  console.log("\n--- Test 3: Special characters ---");
  await testChat("Chó 🐶 mèo 🐱 !@#$%^&*()");
  
  // Test 4: Invalid endpoint
  console.log("\n--- Test 4: Invalid endpoint ---");
  try {
    await axios.post("http://localhost:8001/invalid", { message: "test" });
  } catch (error) {
    console.log("✅ Correctly handled 404 error");
  }
};

/**
 * Test performance
 */
export const testPerformance = async (iterations = 10) => {
  console.log(`⚡ Testing performance (${iterations} iterations)...`);
  
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await testChat(`Test message ${i + 1}`);
    const end = performance.now();
    times.push(end - start);
    
    // Wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log("\n📊 Performance Results:");
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);
  
  return { avg, min, max, times };
};

/**
 * Run all tests
 */
export const testAPI = async () => {
  console.log("🚀 Running all API tests...\n");
  console.log("=" .repeat(50));
  
  // Test 1: Connection
  console.log("\n📡 TEST 1: CONNECTION");
  console.log("-".repeat(50));
  const connected = await testConnection();
  
  if (!connected) {
    console.log("\n❌ Cannot proceed without connection");
    return;
  }
  
  // Test 2: Basic chat
  console.log("\n💬 TEST 2: BASIC CHAT");
  console.log("-".repeat(50));
  await testChat("Xin chào");
  
  // Test 3: Multiple messages
  console.log("\n🔄 TEST 3: MULTIPLE MESSAGES");
  console.log("-".repeat(50));
  await testMultipleMessages([
    "Chó của tôi bị ốm",
    "Mèo không chịu ăn"
  ]);
  
  // Test 4: Error handling
  console.log("\n🧪 TEST 4: ERROR HANDLING");
  console.log("-".repeat(50));
  await testErrorHandling();
  
  // Test 5: Performance
  console.log("\n⚡ TEST 5: PERFORMANCE");
  console.log("-".repeat(50));
  await testPerformance(5);
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ All tests completed!");
};

/**
 * Quick test - chỉ test connection và 1 message
 */
export const quickTest = async () => {
  console.log("⚡ Quick test...\n");
  
  const connected = await testConnection();
  if (connected) {
    await testChat("Xin chào");
  }
};

// Export default
export default {
  testAPI,
  quickTest,
  testConnection,
  testChat,
  testMultipleMessages,
  testErrorHandling,
  testPerformance
};

// Usage examples in console:
console.log(`
🧪 TinyPaws Chatbot API Test Utility

Sử dụng trong console:

// Import
import apiTest from './components/chatbot/api-test';

// Quick test
apiTest.quickTest();

// Full test suite
apiTest.testAPI();

// Individual tests
apiTest.testConnection();
apiTest.testChat("Chó của tôi bị ốm");
apiTest.testMultipleMessages(["msg1", "msg2"]);
apiTest.testPerformance(10);
`);
