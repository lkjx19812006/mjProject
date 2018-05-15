// remote_api.js 模拟第三方 API
'use strict';

const app = require('express')();

app.get('/', (req, res) => {
  setTimeout(() => {
    let arr = [200, 300]; // 200 代表成功，300 代表失败需要重新请求
    res.status(200).send({ 'status': arr[parseInt(Math.random() * 2)] });
  }, 3000);
});

app.listen('9001', () => {
  console.log('API 服务监听端口：9001');
});
// producer.js 自身应用 API，用来接受用户请求并将任务加入任务队列
'use strict';

const app = require('express')();
const redisClient = require('redis').createClient();

const QUEUE_NAME = 'queue:example';

function addTaskToQueue(taskName, callback) {
  // 先判断任务是否已经存在，存在：跳过，不存在：加入任务队列
  redisClient.zscore(QUEUE_NAME, taskName, (error, task) => {
    if (error) {
      console.log(error);
    } else {
      if (task) {
        console.log('任务已存在，不新增相同任务');
        callback(null, task);
      } else {
        redisClient.zadd(QUEUE_NAME, new Date().getTime(), taskName, (error, result) => {
          if (error) {
            callback(error);
          } else {
            callback(null, result);
          }
        });
      }
    }
  });
}

app.get('/', (req, res) => {
  let taskName = req.query['task-name'];
  addTaskToQueue(taskName, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      res.status(200).send('正在查询中......');
    }
  });
});

app.listen(9002, () => {
  console.log('生产者服务监听端口：9002');
});
// consumer.js 定时获取任务并执行
'use strict';

const redisClient = require('redis').createClient();
const request = require('request');
const schedule = require('node-schedule');

const QUEUE_NAME = 'queue:expmple';
const PARALLEL_TASK_NUMBER = 2; // 并行执行任务数量

function getTasksFromQueue(callback) {
  // 获取多个任务
  redisClient.zrangebyscore([QUEUE_NAME, 1, new Date().getTime(), 'LIMIT', 0, PARALLEL_TASK_NUMBER], (error, tasks) => {
    if (error) {
      callback(error);
    } else {
      // 将任务分值设置为 0，表示正在处理
      if (tasks.length > 0) {
        let tmp = [];
        tasks.forEach((task) => {
          tmp.push(0);
          tmp.push(task);
        });
        redisClient.zadd([QUEUE_NAME].concat(tmp), (error, result) => {
          if (error) {
            callback(error);
          } else {
            callback(null, tasks)
          }
        });
      }
    }
  });
}

function addFailedTaskToQueue(taskName, callback) {
  redisClient.zadd(QUEUE_NAME, new Date().getTime(), taskName, (error, result) => {
    if (error) {
      callback(error);
    } else {
      callback(null, result);
    }
  });
}

function removeSucceedTaskFromQueue(taskName, callback) {
  redisClient.zrem(QUEUE_NAME, taskName, (error, result) => {
    if (error) {
      callback(error);
    } else {
      callback(null, result);
    }
  })
}

function execTask(taskName) {
  return new Promise((resolve, reject) => {
    let requestOptions = {
      'url': 'http://127.0.0.1:9001',
      'method': 'GET',
      'timeout': 5000
    };
    request(requestOptions, (error, response, body) => {
      if (error) {
        resolve('failed');
        console.log(error);
        addFailedTaskToQueue(taskName, (error) => {
          if (error) {
            console.log(error);
          } else {

          }
        });
      } else {
        try {
          body = typeof body !== 'object' ? JSON.parse(body) : body;
        } catch (error) {
          resolve('failed');
          console.log(error);
          addFailedTaskToQueue(taskName, (error, result) => {
            if (error) {
              console.log(error);
            } else {

            }
          });
          return;
        }
        if (body.status !== 200) {
          resolve('failed');
          addFailedTaskToQueue(taskName, (error, result) => {
            if (error) {
              console.log(error);
            } else {

            }
          });
        } else {
          resolve('succeed');
          removeSucceedTaskFromQueue(taskName, (error, result) => {
            if (error) {
              console.log(error);
            } else {

            }
          });
        }
      }
    });
  });
}

// 定时，每隔 5 秒获取新的任务来执行
let job = schedule.scheduleJob('*/5 * * * * *', () => {
  console.log('获取新任务');
  getTasksFromQueue((error, tasks) => {
    if (error) {
      console.log(error);
    } else {
      if (tasks.length > 0) {
        console.log(tasks);

        Promise.all(tasks.map(execTask))
          .then((results) => {
            console.log(results);
          })
          .catch((error) => {
            console.log(error);
          });

      }
    }
  });
});