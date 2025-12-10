// 在浏览器 DevTools 控制台运行
async function testPerformance() {
  const startTime = Date.now();
  const startMemory = performance.memory.usedJSHeapSize;
  
  for (let i = 0; i < 100; i++) {
    console.log(`发送消息 ${i + 1}/100`);
    // 模拟发送消息
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  const endMemory = performance.memory.usedJSHeapSize;
  
  console.log('总耗时:', endTime - startTime, 'ms');
  console.log('内存增长:', (endMemory - startMemory) / 1024 / 1024, 'MB');
}

testPerformance();
