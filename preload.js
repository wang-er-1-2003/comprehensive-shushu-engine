// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 术数引擎子件 - preload：暴露数据桥
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('qianzhan', {
  data: () => ipcRenderer.invoke('qianzhan-data'),
  dreamMsg: (id) => ipcRenderer.invoke('qianzhan-dream-msg', id),
  tarotCase: (key) => ipcRenderer.invoke('qianzhan-tarot-case', key),
  export: (payload, filename) => ipcRenderer.invoke('qianzhan-export', payload, filename),
});
