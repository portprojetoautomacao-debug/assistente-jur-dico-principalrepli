# 🖥️ Guia: Integrar Componentes Windows no App React via Electron

## 📋 Pré-requisitos

- Node.js 22.x ✅ (já instalado)
- Seu app React funcionando ✅
- Windows 10/11 (para testar componentes nativos)

---

## 🚀 Passo 1: Instalar Electron

```bash
cd /workspaces/assistente-jur-dico-principal

# Instalar Electron
npm install --save-dev electron electron-builder

# Instalar dependências para .NET interop
npm install edge-js ffi-napi ref-napi
```

---

## 📁 Passo 2: Criar Estrutura Electron

### 2.1 Criar `electron/main.js`

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Modo desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Produção
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### 2.2 Criar `electron/preload.js`

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs .NET para React
contextBridge.exposeInMainWorld('dotnet', {
  // Chamar métodos .NET
  invoke: (method, ...args) => ipcRenderer.invoke('dotnet-invoke', method, args),
  
  // Usar controles WPF
  openWPFDialog: (xaml) => ipcRenderer.invoke('wpf-dialog', xaml),
  
  // COM Interop
  createCOMObject: (progId) => ipcRenderer.invoke('com-create', progId)
});
```

---

## 🔧 Passo 3: Bridge .NET ↔ Electron

### 3.1 Criar `electron/dotnet-bridge.js`

```javascript
const edge = require('edge-js');

// Compilar código C# em runtime
const invokeCSMethod = edge.func(`
  async (input) => {
    // Seu código C# aqui
    return await Task.Run(() => {
      // Exemplo: usar WPF
      var button = new System.Windows.Controls.Button();
      button.Content = input.text;
      return button.Content.ToString();
    });
  }
`);

// Abrir WPF Dialog
const openWPFDialog = edge.func({
  source: `
    using System.Windows;
    using System.Windows.Controls;
    
    public class Startup {
      public async Task<object> Invoke(dynamic input) {
        var dialog = new Window {
          Title = input.title,
          Width = 400,
          Height = 300
        };
        
        dialog.ShowDialog();
        return "OK";
      }
    }
  `,
  references: [
    'System.dll',
    'PresentationFramework.dll',
    'WindowsBase.dll'
  ]
});

// COM Interop - Exemplo Excel
const createExcelCOM = edge.func(`
  async (input) => {
    Type excelType = Type.GetTypeFromProgID("Excel.Application");
    dynamic excel = Activator.CreateInstance(excelType);
    excel.Visible = true;
    return "Excel aberto";
  }
`);

module.exports = {
  invokeCSMethod,
  openWPFDialog,
  createExcelCOM
};
```

### 3.2 Registrar IPC Handlers em `electron/main.js`

```javascript
const { ipcMain } = require('electron');
const { invokeCSMethod, openWPFDialog, createExcelCOM } = require('./dotnet-bridge');

ipcMain.handle('dotnet-invoke', async (event, method, args) => {
  return await invokeCSMethod({ method, args });
});

ipcMain.handle('wpf-dialog', async (event, xaml) => {
  return await openWPFDialog({ xaml });
});

ipcMain.handle('com-create', async (event, progId) => {
  if (progId === 'Excel.Application') {
    return await createExcelCOM();
  }
  // Adicionar outros COM objects
});
```

---

## ⚛️ Passo 4: Usar no React

### 4.1 Criar Hook `src/hooks/use-dotnet.ts`

```typescript
import { useCallback } from 'react';

declare global {
  interface Window {
    dotnet: {
      invoke: (method: string, ...args: any[]) => Promise<any>;
      openWPFDialog: (xaml: string) => Promise<string>;
      createCOMObject: (progId: string) => Promise<any>;
    };
  }
}

export function useDotNet() {
  const invokeMethod = useCallback(async (method: string, ...args: any[]) => {
    if (!window.dotnet) {
      throw new Error('Dotnet bridge não disponível (use Electron)');
    }
    return await window.dotnet.invoke(method, ...args);
  }, []);

  const openWPFDialog = useCallback(async (title: string) => {
    return await window.dotnet.openWPFDialog(title);
  }, []);

  const createExcel = useCallback(async () => {
    return await window.dotnet.createCOMObject('Excel.Application');
  }, []);

  return {
    invokeMethod,
    openWPFDialog,
    createExcel
  };
}
```

### 4.2 Exemplo de Uso em Componente

```tsx
// src/components/DotNetExample.tsx
import { useDotNet } from '@/hooks/use-dotnet';
import { Button } from '@/components/ui/button';

export default function DotNetExample() {
  const { openWPFDialog, createExcel } = useDotNet();

  return (
    <div className="p-4 space-y-4">
      <Button onClick={() => openWPFDialog('Teste WPF')}>
        Abrir Dialog WPF
      </Button>

      <Button onClick={createExcel}>
        Abrir Excel (COM)
      </Button>
    </div>
  );
}
```

---

## 📦 Passo 5: Configurar package.json

Adicione os scripts:

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron electron/main.js\"",
    "electron:build": "npm run build && electron-builder",
    "electron:start": "electron electron/main.js"
  },
  "build": {
    "appId": "com.assistente-juridico.app",
    "productName": "Assistente Jurídico PJe",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "public/icon.ico"
    }
  }
}
```

---

## 🎯 Componentes .NET Disponíveis

### ✅ Windows Forms Controls
```csharp
// Via edge-js
var form = new System.Windows.Forms.Form();
var button = new System.Windows.Forms.Button();
```

### ✅ WPF Controls
```csharp
using System.Windows.Controls;
var grid = new Grid();
var textBox = new TextBox();
var dataGrid = new DataGrid();
```

### ✅ UWP (via Windows.UI.Xaml)
```csharp
// Requer Windows 10+ SDK
using Windows.UI.Xaml.Controls;
var navView = new NavigationView();
```

### ✅ COM Interop
```csharp
// Excel
Type.GetTypeFromProgID("Excel.Application");

// Word
Type.GetTypeFromProgID("Word.Application");

// Outlook
Type.GetTypeFromProgID("Outlook.Application");
```

---

## 🚀 Executar o App

```bash
# Desenvolvimento (hot reload)
npm run electron:dev

# Build para Windows
npm run electron:build
```

---

## ⚠️ Limitações

1. **Edge.js requer .NET Framework 4.6+** instalado no Windows
2. **WPF só funciona em Windows** (não Linux/Mac)
3. **COM Interop** requer componentes registrados (Office, etc.)
4. **Performance**: bridge tem overhead de comunicação

---

## 💡 Alternativa Leve: WebView2

Se só precisa de **interface nativa** sem .NET:

```bash
npm install @webview/webview
```

Permite usar controles Windows nativos sem .NET completo.

---

## 📚 Referências

- **Edge.js**: https://github.com/tjanczuk/edge
- **Electron**: https://www.electronjs.org/
- **Electron .NET**: https://github.com/ElectronNET/Electron.NET
- **WebView2**: https://developer.microsoft.com/microsoft-edge/webview2/

---

## ✅ Checklist de Implementação

- [ ] Instalar Electron e dependências
- [ ] Criar estrutura electron/ com main.js e preload.js
- [ ] Implementar dotnet-bridge.js com edge-js
- [ ] Criar hook useDotNet() no React
- [ ] Testar componente exemplo
- [ ] Configurar electron-builder
- [ ] Build para Windows (.exe)

---

**Pronto! Agora você pode usar componentes .NET/WPF/COM no seu app React** 🎉
