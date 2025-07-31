<template>
  <!-- Vue Component: FinanceTable -->
  <div class="min-h-screen bg-gray-50">
    <!-- Header Mobile -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">💰 FinanceApp</h1>
          </div>
          <div class="flex items-center space-x-2">
            <span :class="saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" 
                  class="text-sm font-semibold hidden sm:block">
              {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </span>
            <button class="p-2 text-gray-400 hover:text-gray-600 lg:hidden">
              <i class="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Container Principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

      <!-- Card Saldo Mobile -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg sm:hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">Saldo Atual</p>
            <p :class="saldoFinal < 0 ? 'text-red-200' : 'text-white'" 
               class="text-3xl font-bold">
              {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-blue-100 text-sm">{{ data.length }}</p>
            <p class="text-blue-100 text-xs">registros</p>
          </div>
        </div>
      </div>

      <!-- Importação CSV -->
      <CSVImport :onImport="handleImport" />

      <!-- Formulário Mobile Otimizado -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-plus-circle text-blue-500 mr-2"></i>
            Novo Registro
          </h2>
        </div>
        
        <!-- Formulário Desktop -->
        <form @submit.prevent="handleAdd" class="hidden lg:block p-4">
          <div class="grid grid-cols-7 gap-3 items-center">
            <input v-model="newRecord.Data" type="date" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text" placeholder="Descrição" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            <input v-model.number="newRecord.Valor" type="number" step="0.01" placeholder="R$ 0,00" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            <select v-model="newRecord.Tipo" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
            <select v-model="newRecord.Categoria" @change="onCategoryChange" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">🤖 Auto-detectar categoria</option>
              <optgroup label="📂 Categorias Disponíveis">
                <option v-for="category in getAllCategories()" :key="category" :value="category">
                  {{ getCategoryIcon(category) }} {{ category }}
                </option>
              </optgroup>
            </select>
            <select v-model="newRecord.Status" class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
              <option value="❌">❌</option>
              <option value="✔️">✔️</option>
            </select>
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
              <i class="fa fa-plus mr-1"></i>Adicionar
            </button>
          </div>
        </form>

        <!-- Formulário Mobile -->
        <form @submit.prevent="handleAdd" class="lg:hidden p-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input v-model="newRecord.Data" type="date" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input v-model.number="newRecord.Valor" type="number" step="0.01" placeholder="R$ 0,00" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text" placeholder="Ex: Supermercado, Salário..." class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select v-model="newRecord.Tipo" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none" required>
                <option value="Receita">💰 Receita</option>
                <option value="Despesa">💸 Despesa</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="newRecord.Status" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none" required>
                <option value="❌">❌ Pendente</option>
                <option value="✔️">✔️ Confirmado</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select v-model="newRecord.Categoria" @change="onCategoryChange" class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">🤖 Auto-detectar categoria</option>
              <optgroup label="📂 Categorias Disponíveis">
                <option v-for="category in getAllCategories()" :key="category" :value="category">
                  {{ getCategoryIcon(category) }} {{ category }}
                </option>
              </optgroup>
            </select>
          </div>

          <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 font-semibold text-lg transition-colors shadow-lg">
            <i class="fa fa-plus mr-2"></i>
            Adicionar Registro
          </button>
        </form>
      </section>

      <!-- Filtros Mobile -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <!-- Filtros Básicos -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex flex-wrap gap-2">
            <button @click="setFilter('all')" :class="[
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'px-4 py-2 rounded-full text-sm font-medium transition-colors'
            ]">
              📊 Todos
            </button>
            <button @click="setFilter('Receita')" :class="[
              filter === 'Receita' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'px-4 py-2 rounded-full text-sm font-medium transition-colors'
            ]">
              💰 Receitas
            </button>
            <button @click="setFilter('Despesa')" :class="[
              filter === 'Despesa' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              'px-4 py-2 rounded-full text-sm font-medium transition-colors'
            ]">
              💸 Despesas
            </button>
          </div>
          
          <!-- Indicador de filtro de categoria ativo -->
          <div v-if="categoryFilter" class="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span class="text-sm text-orange-800">
              🔍 <strong>{{ getCategoryIcon(categoryFilter) }} {{ categoryFilter }}</strong>
            </span>
            <button @click="clearCategoryFilter" class="text-orange-600 hover:text-orange-800 ml-auto">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <!-- Controles de Edição (Desktop) -->
        <div class="hidden lg:flex items-center justify-between p-4 bg-gray-50">
          <span class="text-sm text-gray-600">{{ filteredData.length }} registros encontrados</span>
          <div class="flex gap-2">
            <button 
              v-if="editingItems.size === 0"
              @click="startEditAllItems" 
              class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              <i class="fas fa-edit mr-1"></i> Editar Todos
            </button>
            
            <template v-if="editingItems.size > 0">
              <span class="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
                <i class="fas fa-edit mr-1"></i>
                {{ editingItems.size }} em edição
              </span>
              <button 
                @click="saveAllEditItems" 
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <i class="fas fa-save mr-1"></i> Salvar
              </button>
              <button 
                @click="cancelAllEditItems" 
                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <i class="fas fa-times mr-1"></i> Cancelar
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- Lista Mobile (Cards) -->
      <section class="lg:hidden space-y-3">
        <div v-if="filteredData.length === 0" class="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <div class="text-gray-400 text-4xl mb-4">📱</div>
          <p class="text-gray-500">Nenhum registro encontrado</p>
          <p class="text-gray-400 text-sm">Adicione seu primeiro registro acima</p>
        </div>
        
        <div 
          v-for="(item, index) in filteredData" 
          :key="index"
          class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <!-- Card Normal -->
          <div v-if="!isEditing(index)" class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm text-gray-500">{{ item.Data }}</span>
                  <span class="text-xs px-2 py-1 rounded-full" 
                        :class="item.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                    {{ item.Status === '✔️' ? '✔️ Confirmado' : '❌ Pendente' }}
                  </span>
                </div>
                <h3 class="font-semibold text-gray-900 text-lg">{{ item.Descrição }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="item.Categoria" class="text-sm text-gray-600">
                    {{ getCategoryIcon(item.Categoria) }} {{ item.Categoria }}
                  </span>
                  <span v-else class="text-sm text-gray-400 italic">Sem categoria</span>
                </div>
              </div>
              <div class="text-right">
                <div :class="item.Valor < 0 ? 'text-red-600' : 'text-green-600'" 
                     class="text-xl font-bold">
                  {{ item.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </div>
                <div class="text-sm text-gray-500">
                  Saldo: {{ item.Saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </div>
              </div>
            </div>
            
            <!-- Ações Mobile -->
            <div class="flex gap-2 pt-3 border-t border-gray-100">
              <button 
                @click="startEditItem(index)" 
                class="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                <i class="fas fa-edit mr-1"></i> Editar
              </button>
              <button 
                @click="confirmDelete(index)" 
                class="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- Card de Edição -->
          <div v-else class="p-4 bg-gray-50">
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Data</label>
                  <input v-model="getEditRecord(index).Data" type="date" class="w-full border border-gray-300 p-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                  <input v-model.number="getEditRecord(index).Valor" type="number" step="0.01" class="w-full border border-gray-300 p-2 rounded-lg text-sm" />
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <input v-model="getEditRecord(index).Descrição" type="text" class="w-full border border-gray-300 p-2 rounded-lg text-sm" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select v-model="getEditRecord(index).Tipo" class="w-full border border-gray-300 p-2 rounded-lg text-sm">
                    <option value="Receita">💰 Receita</option>
                    <option value="Despesa">💸 Despesa</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select v-model="getEditRecord(index).Status" class="w-full border border-gray-300 p-2 rounded-lg text-sm">
                    <option value="❌">❌ Pendente</option>
                    <option value="✔️">✔️ Confirmado</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                <select v-model="getEditRecord(index).Categoria" class="w-full border border-gray-300 p-2 rounded-lg text-sm">
                  <option value="">📋 Sem categoria</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
              </div>

              <div class="flex gap-2 pt-2">
                <button 
                  @click="saveEditItem(index)" 
                  class="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <i class="fas fa-save mr-1"></i> Salvar
                </button>
                <button 
                  @click="cancelEditItem(index)" 
                  class="bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabela Desktop -->
      <section class="hidden lg:block overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
        <table class="w-full table-auto">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor (R$)</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in filteredData" :key="index">
            <template v-if="isEditing(index)">
              <td><input v-model="getEditRecord(index).Data" type="date" class="border p-1 w-full" /></td>
              <td><input v-model="getEditRecord(index).Descrição" type="text" class="border p-1 w-full" /></td>
              <td><input v-model.number="getEditRecord(index).Valor" type="number" step="0.01" placeholder="R$ 0,00" class="border p-1 w-full" /></td>
              <td>
                <select v-model="getEditRecord(index).Tipo" class="border p-1 w-full">
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </select>
              </td>
              <td>
                <select v-model="getEditRecord(index).Categoria" class="border p-1 w-full">
                  <option value="">📋 Sem categoria</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
              </td>
              <td>
                <select v-model="getEditRecord(index).Status" class="border p-1 w-full">
                  <option value="❌">❌</option>
                  <option value="✔️">✔️</option>
                </select>
              </td>
              <td>{{ item.Saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</td>
              <td>
                <button @click="saveEditItem(index)" class="text-green-600 px-2" title="Salvar este item">
                  <i class="fa fa-save"></i>
                </button>
                <button @click="cancelEditItem(index)" class="text-gray-600 px-2" title="Cancelar edição deste item">
                  <i class="fa fa-times"></i>
                </button>
              </td>
            </template>
            <template v-else>
              <td class="px-4 py-2">{{ item.Data }}</td>
              <td class="px-4 py-2">{{ item.Descrição }}</td>
              <td :class="item.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="px-4 py-2">
                {{ item.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </td>
              <td class="px-4 py-2">{{ item.Tipo }}</td>
              <td class="px-4 py-2">
                <span v-if="item.Categoria">
                  {{ getCategoryIcon(item.Categoria) }} {{ item.Categoria }}
                </span>
                <span v-else class="text-gray-400 italic">Sem categoria</span>
              </td>
              <td class="px-4 py-2">{{ item.Status }}</td>
              <td :class="item.Saldo < 0 ? 'text-red-600' : 'text-green-600'" class="px-4 py-2">
                {{ item.Saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </td>
              <td class="px-4 py-2">
                <button @click="startEditItem(index)" class="text-yellow-600 px-2" title="Editar este item">
                  <i class="fa fa-edit"></i>
                </button>
                <button @click="confirmDelete(index)" class="text-red-600 px-2" title="Excluir este item">
                  <i class="fa fa-trash"></i>
                </button>
              </td>
            </template>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Saldo Final Desktop -->
      <div class="hidden lg:block">
        <div :class="saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" class="text-center text-xl font-bold p-4 bg-white rounded-2xl border border-gray-200">
          Saldo Final: {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
        </div>
      </div>

      <!-- Resumo por Categorias -->
      <section class="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              💼 Resumo por Categorias
            </h2>
            <div class="flex gap-2">
              <span class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full hidden sm:block">
                {{ data.length }} registros
              </span>
              <span class="text-xs text-gray-600 bg-blue-100 px-2 py-1 rounded-full">
                {{ Object.keys(getCategoryTotals()).length }} categorias
              </span>
            </div>
          </div>
        </div>
        
        <div class="p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div 
              v-for="(total, category) in getCategoryTotals()" 
              :key="category"
              :class="total < 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-green-50 border-green-200 hover:bg-green-100'"
              class="p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-95"
              @click="filterByCategory(category)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-gray-900 truncate">
                      {{ getCategoryIcon(category) }} {{ category }}
                    </span>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full inline-block" 
                        :class="total < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                    {{ total < 0 ? '💸 Despesa' : '💰 Receita' }}
                  </span>
                </div>
                <div class="text-right ml-2">
                  <div :class="total < 0 ? 'text-red-600' : 'text-green-600'" 
                       class="font-bold text-lg">
                    {{ total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Gráfico -->
      <section class="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            📊 Receitas vs Despesas
          </h2>
        </div>
        <div class="p-4">
          <div class="w-full max-w-sm mx-auto">
            <canvas ref="chartRef" height="200"></canvas>
          </div>
        </div>
      </section>
      
      <!-- Spacing bottom para mobile -->
      <div class="h-20 lg:h-0"></div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <Transition name="modal">
      <div 
        v-if="showDeleteConfirm" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="cancelDelete"
      >
        <div 
          class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all modal-content"
          @click.stop
        >
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Confirmar Exclusão
            </h3>
            
            <p class="text-gray-600 mb-2">
              Tem certeza que deseja excluir este registro?
            </p>
            
            <div v-if="itemToDelete" class="bg-gray-50 rounded-lg p-3 mb-4 text-left">
              <div class="text-sm text-gray-800 font-medium">{{ itemToDelete.record.Descrição }}</div>
              <div class="text-sm text-gray-600">{{ itemToDelete.record.Data }}</div>
              <div :class="itemToDelete.record.Valor < 0 ? 'text-red-600' : 'text-green-600'" 
                   class="text-sm font-semibold">
                {{ itemToDelete.record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </div>
            </div>
            
            <div class="flex gap-3">
              <button 
                @click="cancelDelete"
                class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                @click="executeDelete"
                class="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                <i class="fas fa-trash mr-1"></i>
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast de Undo -->
    <Transition name="toast">
      <div 
        v-if="showUndoToast"
        class="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50"
      >
        <div class="bg-gray-800 text-white rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <i class="fas fa-check text-white text-sm"></i>
            </div>
            <div>
              <div class="font-medium">Registro excluído</div>
              <div v-if="deletedItem" class="text-sm text-gray-300 truncate">
                {{ deletedItem.record.Descrição }}
              </div>
              <div class="text-xs text-gray-400">
                {{ undoTimeLeft }}s restantes
              </div>
            </div>
          </div>
          
          <div class="flex gap-2 ml-4">
            <button 
              @click="undoDelete"
              class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              <i class="fas fa-undo mr-1"></i>
              Desfazer
            </button>
            <button 
              @click="hideUndoToast"
              class="text-gray-300 hover:text-white p-1"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useCategoryDetection } from '../composables/useCategoryDetection';
import CSVImport from './CSVImport.vue';
import Chart from 'chart.js/auto';
import type { IFinanceRecord } from '../types/finance';

export default {
  name: 'FinanceTable',
  components: {
    CSVImport,
  },
  setup() {
    const {
      data,
      filteredData,
      saldoFinal,
      editIndex,
      editingItems,
      filter,
      categoryFilter,
      addRecord,
      removeRecord,
      updateRecord,
      setFilter,
      setCategoryFilter,
      clearCategoryFilter,
      toggleEdit,
      startEditAll,
      cancelAllEdits,
      isEditing,
      importRecords,
    } = useFinance();

    const { detectCategory, getAllCategories } = useCategoryDetection();

    // Função para obter data atual no formato YYYY-MM-DD
    function getCurrentDate(): string {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    const newRecord = reactive({
      Data: getCurrentDate(),
      Descrição: '',
      Valor: 0,
      Tipo: 'Receita',
      Categoria: '',
      Status: '❌',
    });

    const editRecord = reactive({
      Data: '',
      Descrição: '',
      Valor: 0,
      Tipo: 'Receita',
      Categoria: '',
      Status: '❌',
    });

    // Mapa para armazenar dados de múltiplos registros sendo editados
    const editRecords = ref<Map<number, IFinanceRecord>>(new Map());

    // Estados para confirmação de exclusão e undo
    const showDeleteConfirm = ref<boolean>(false);
    const itemToDelete = ref<{ index: number; record: IFinanceRecord } | null>(null);
    const deletedItem = ref<{ index: number; record: IFinanceRecord } | null>(null);
    const showUndoToast = ref<boolean>(false);
    const undoTimeout = ref<NodeJS.Timeout | null>(null);
    const undoTimeLeft = ref<number>(5);

    function handleAdd() {
      if (!newRecord.Data || !newRecord.Descrição || !newRecord.Valor) return;
      
      // Detectar categoria automaticamente se não estiver preenchida
      const categoria = newRecord.Categoria || detectCategory(newRecord.Descrição);
      
      addRecord({ 
        ...newRecord,
        Categoria: categoria
      });
      
      Object.assign(newRecord, {
        Data: getCurrentDate(),
        Descrição: '',
        Valor: 0,
        Tipo: 'Receita',
        Categoria: '',
        Status: '❌',
      });
    }

    // Detectar categoria quando descrição muda
    function onDescriptionChange() {
      // Só detecta automaticamente se nenhuma categoria foi selecionada manualmente
      if (newRecord.Descrição && !newRecord.Categoria) {
        const detectedCategory = detectCategory(newRecord.Descrição);
        if (detectedCategory && detectedCategory !== 'Outros') {
          newRecord.Categoria = detectedCategory;
        }
      }
    }

    // Limpar categoria quando descrição muda (para nova detecção)
    function onCategoryChange() {
      // Se o usuário selecionar uma categoria manualmente, para a detecção automática
      // (não faz nada, apenas previne conflitos)
    }

    // Ícones para cada categoria
    function getCategoryIcon(category: string): string {
      const icons: Record<string, string> = {
        'Alimentação': '🍽️',
        'Moradia': '🏠',
        'Transporte': '🚗',
        'Saúde': '🏥',
        'Educação': '📚',
        'Lazer': '🎮',
        'Compras': '🛒',
        'Serviços': '⚙️',
        'Dívidas': '💳',
        'Investimentos': '📈',
        'Renda': '💰',
        'Outros': '📋'
      };
      return icons[category] || '📋';
    }

    // Calcular totais por categoria
    function getCategoryTotals(): Record<string, number> {
      const totals: Record<string, number> = {};
      
      // Usar data.value ao invés de filteredData.value para calcular totais completos
      data.value.forEach(item => {
        const category = item.Categoria || 'Sem categoria';
        if (!totals[category]) {
          totals[category] = 0;
        }
        totals[category] += item.Valor;
      });

      // Filtrar apenas categorias que têm valores (remover zeros)
      const filteredTotals = Object.fromEntries(
        Object.entries(totals).filter(([, value]) => value !== 0)
      );

      // Ordenar por valor absoluto (maiores gastos/receitas primeiro)
      const sortedEntries = Object.entries(filteredTotals)
        .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a));
      
      return Object.fromEntries(sortedEntries);
    }

    function startEdit(index: number) {
      editIndex.value = index;
      const record = filteredData.value[index];
      Object.assign(editRecord, { ...record });
    }

    function cancelEdit() {
      editIndex.value = null;
    }

    function saveEdit(index: number) {
      updateRecord(index, { ...editRecord });
      editIndex.value = null;
    }

    function handleImport(records: Omit<IFinanceRecord, 'Saldo'>[]) {
      importRecords(records);
    }

    function filterByCategory(category: string) {
      setCategoryFilter(category);
    }

    // Função para iniciar edição de um item específico
    function startEditItem(index: number) {
      const record = filteredData.value[index];
      editRecords.value.set(index, { ...record });
      toggleEdit(index);
    }

    // Função para salvar um item específico
    function saveEditItem(index: number) {
      const editedRecord = editRecords.value.get(index);
      if (editedRecord) {
        updateRecord(index, editedRecord);
        editRecords.value.delete(index);
        toggleEdit(index);
      }
    }

    // Função para cancelar edição de um item específico
    function cancelEditItem(index: number) {
      editRecords.value.delete(index);
      toggleEdit(index);
    }

    // Função para salvar todas as edições
    function saveAllEditItems() {
      editRecords.value.forEach((editedRecord, index) => {
        updateRecord(index, editedRecord);
      });
      editRecords.value.clear();
      cancelAllEdits();
    }

    // Função para iniciar edição de todos os itens
    function startEditAllItems() {
      filteredData.value.forEach((record, index) => {
        editRecords.value.set(index, { ...record });
      });
      startEditAll();
    }

    // Função para cancelar todas as edições
    function cancelAllEditItems() {
      editRecords.value.clear();
      cancelAllEdits();
    }

    // Função para obter o registro editado ou o original
    function getEditRecord(index: number): IFinanceRecord {
      return editRecords.value.get(index) || filteredData.value[index];
    }

    // Funções para confirmação de exclusão
    function confirmDelete(index: number) {
      const record = filteredData.value[index];
      itemToDelete.value = { index, record };
      showDeleteConfirm.value = true;
    }

    function cancelDelete() {
      showDeleteConfirm.value = false;
      itemToDelete.value = null;
    }

    function executeDelete() {
      if (!itemToDelete.value) return;

      const { index, record } = itemToDelete.value;
      
      // Armazenar item para undo
      deletedItem.value = { index, record };
      
      // Executar exclusão
      removeRecord(index);
      
      // Mostrar toast de undo
      showUndoToast.value = true;
      undoTimeLeft.value = 5;
      
      // Contador regressivo
      const countdown = setInterval(() => {
        undoTimeLeft.value--;
        if (undoTimeLeft.value <= 0) {
          clearInterval(countdown);
        }
      }, 1000);
      
      // Auto-hide undo após 5 segundos
      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
      }
      undoTimeout.value = setTimeout(() => {
        clearInterval(countdown);
        hideUndoToast();
      }, 5000);

      // Limpar confirmação
      showDeleteConfirm.value = false;
      itemToDelete.value = null;
    }

    // Funções para undo
    function undoDelete() {
      if (!deletedItem.value) return;

      const { index, record } = deletedItem.value;
      
      // Restaurar item na posição original
      data.value.splice(index, 0, record);
      
      // Limpar undo
      hideUndoToast();
    }

    function hideUndoToast() {
      showUndoToast.value = false;
      deletedItem.value = null;
      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
        undoTimeout.value = null;
      }
    }

    // Função removida - usando classes dinâmicas diretamente no template

    // Chart.js
    const chartRef = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    function renderChart() {
      const receitas = data.value
        .filter((item) => item.Tipo === 'Receita')
        .reduce((acc, item) => acc + item.Valor, 0);
      const despesas = data.value
        .filter((item) => item.Tipo === 'Despesa')
        .reduce((acc, item) => acc + item.Valor, 0);

      if (chartInstance) {
        chartInstance.destroy();
      }

      if (!chartRef.value) return;

      const ctx = chartRef.value.getContext('2d');
      if (!ctx) return;

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Receitas', 'Despesas'],
          datasets: [
            {
              data: [receitas, Math.abs(despesas)],
              backgroundColor: ['#22c55e', '#ef4444'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
          },
        },
      });
    }

    watch(
      () => data.value,
      () => {
        renderChart();
      },
      { deep: true, immediate: true }
    );

    onMounted(() => {
      renderChart();
    });

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      // Limpar timeout do undo
      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
      }
    });

    return {
      data,
      filteredData,
      saldoFinal,
      editIndex,
      editingItems,
      editRecords,
      filter,
      categoryFilter,
      newRecord,
      editRecord,
      handleAdd,
      onDescriptionChange,
      onCategoryChange,
      startEditItem,
      saveEditItem,
      cancelEditItem,
      saveAllEditItems,
      startEditAllItems,
      cancelAllEditItems,
      getEditRecord,
      handleImport,
      filterByCategory,
      removeRecord,
      setFilter,
      chartRef,
      getCurrentDate,
      getAllCategories,
      getCategoryIcon,
      getCategoryTotals,
      clearCategoryFilter,
      isEditing,
      showDeleteConfirm,
      itemToDelete,
      showUndoToast,
      deletedItem,
      undoTimeLeft,
      confirmDelete,
      cancelDelete,
      executeDelete,
      undoDelete,
      hideUndoToast,
    };
  },
};
</script>

<style scoped>
button {
  cursor: pointer;
}

/* Animações do modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* Animações do toast */
.toast-enter-active {
  animation: toastSlideIn 0.3s ease;
}

.toast-leave-active {
  animation: toastSlideOut 0.3s ease;
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toastSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Melhorar touch targets */
@media (max-width: 1024px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
