<template>
  <!-- Vue Component: FinanceTable -->
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- Saldo Mobile Card -->
      <div class="lg:hidden bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="text-center">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Saldo Atual</h2>
          <p :class="saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" class="text-3xl font-bold">
            {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </p>
          <p class="text-sm text-gray-600 mt-2">
            {{ data.length }} transações registradas
          </p>
          <!-- Hidden months indicator -->
          <div v-if="getHiddenMonthsCount() > 0" class="mt-2">
            <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              <i class="fas fa-eye-slash mr-1"></i>
              {{ getHiddenMonthsCount() }} mês{{ getHiddenMonthsCount() > 1 ? 'es' : '' }} oculto{{
                getHiddenMonthsCount() > 1 ? 's' : '' }} do cálculo
            </span>
          </div>
        </div>
      </div>

      <!-- Importação CSV -->
      <CSVImport :onImport="handleImport" />

      <!-- Gerenciador de Visibilidade dos Meses -->
      <MonthVisibilityManager :allAvailableMonths="allAvailableMonths" :toggleMonthVisibility="toggleMonthVisibility"
        :showAllMonths="showAllMonths" :getHiddenMonthsCount="getHiddenMonthsCount" />

      <!-- Debug do Estado (apenas em desenvolvimento) -->
      <StateDebugger v-if="isDevelopment && getStateSnapshot" :getStateSnapshot="getStateSnapshot"
        :clearAllData="clearAllData" />

      <!-- Formulário Mobile Otimizado -->
      <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              <i class="fas fa-plus-circle text-blue-500 mr-2"></i>
              {{ isMultipleMode ? 'Múltiplos Registros' : 'Novo Registro' }}
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{{ isMultipleMode ? 'Múltiplos' : 'Único' }}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="isMultipleMode" type="checkbox" class="sr-only peer">
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Formulário Desktop -->
        <form @submit.prevent="handleAdd" class="hidden lg:block p-4" v-if="!isMultipleMode">
          <div class="grid grid-cols-7 gap-3 items-center">
            <div class="relative">
              <input v-model="newRecord.Data" type="date" v-if="!businessDayMode.enabled"
                class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
              <div v-else class="flex flex-col gap-1">
                <div class="flex gap-1">
                  <select v-model="businessDayMode.month" @change="updateDateFromBusinessDay"
                    class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1">
                    <option v-for="month in 12" :key="month" :value="month">
                      {{ getMonthName(month) }}
                    </option>
                  </select>
                  <select v-model="businessDayMode.year" @change="updateDateFromBusinessDay"
                    class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-20">
                    <option v-for="year in getYearOptions()" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
                <select v-model="businessDayMode.dayNumber" @change="updateDateFromBusinessDay"
                  class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option v-for="day in 25" :key="day" :value="day">
                    {{ getBusinessDayDescription(day) }}
                  </option>
                </select>
                <div class="text-xs text-gray-600">📅 {{ formatDate(newRecord.Data) }}</div>
              </div>
              <button type="button"
                @click="businessDayMode.enabled = !businessDayMode.enabled; if (businessDayMode.enabled) initBusinessDayMode(); else resetToDateInput()"
                class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center"
                :title="businessDayMode.enabled ? 'Usar data normal' : 'Usar dias úteis'">
                {{ businessDayMode.enabled ? '📅' : '💼' }}
              </button>
            </div>
            <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text" placeholder="Descrição"
              class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />
            <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
              inputClass="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />
            <select v-model="newRecord.Tipo"
              class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
            <select v-model="newRecord.Categoria" @change="onCategoryChange"
              class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">🤖 Auto-detectar categoria</option>
              <optgroup label="📂 Categorias Disponíveis">
                <option v-for="category in getAllCategories()" :key="category" :value="category">
                  {{ getCategoryIcon(category) }} {{ category }}
                </option>
              </optgroup>
            </select>
            <select v-model="newRecord.Status"
              class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required>
              <option value="❌">❌</option>
              <option value="✔️">✔️</option>
            </select>
            <button type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
              <i class="fa fa-plus mr-1"></i>Adicionar
            </button>
          </div>

          <!-- Recurrence Controls Desktop -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-700">
                🔄 Configurações de Recorrência
              </h3>
              <label class="flex items-center">
                <input v-model="recurrence.isRecurring.value" type="checkbox" class="mr-2 rounded">
                <span class="text-sm text-gray-700">Tornar recorrente</span>
              </label>
            </div>

            <div v-if="recurrence.isRecurring.value" class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Frequência</label>
                <select v-model="recurrence.recurrenceSettings.value.frequency"
                  class="w-full border border-gray-300 p-2 rounded-lg text-sm">
                  <option value="semanal">📅 Semanal</option>
                  <option value="quinzenal">📆 Quinzenal</option>
                  <option value="mensal">🗓️ Mensal</option>
                  <option value="trimestral">📊 Trimestral</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                <input v-model="recurrence.recurrenceSettings.value.endDate" type="date"
                  class="w-full border border-gray-300 p-2 rounded-lg text-sm">
              </div>
              <div class="flex items-end">
                <div class="text-sm text-gray-600">
                  <div class="font-medium">{{ recurrence.totalOccurrences.value }} ocorrências</div>
                  <div class="text-xs">{{ recurrence.recurrenceDescription.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Formulário Desktop - Múltiplos Registros -->
        <div class="hidden lg:block p-4" v-if="isMultipleMode">
          <div class="space-y-4">
            <!-- Header com contador -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ multipleRecords.length }} registro{{ multipleRecords.length !== 1
                ? 's' : '' }} adicionado{{ multipleRecords.length !== 1 ? 's' : '' }}</span>
              <div class="flex gap-2">
                <button @click="addMultipleRecord" type="button"
                  class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                  <i class="fas fa-plus mr-1"></i>Adicionar à Lista
                </button>
                <button @click="saveAllMultipleRecords" type="button" v-if="multipleRecords.length > 0"
                  class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                  <i class="fas fa-save mr-1"></i>Salvar Todos ({{ multipleRecords.length }})
                </button>
                <button @click="clearMultipleRecords" type="button" v-if="multipleRecords.length > 0"
                  class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                  <i class="fas fa-trash mr-1"></i>Limpar
                </button>
              </div>
            </div>

            <!-- Formulário para adicionar -->
            <div class="grid grid-cols-7 gap-3 items-center p-3 bg-gray-50 rounded-lg">
              <div class="relative">
                <input v-model="newRecord.Data" type="date" v-if="!businessDayModeMultiple.enabled"
                  class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <div v-else class="flex flex-col gap-1">
                  <div class="flex gap-1">
                    <select v-model="businessDayModeMultiple.month" @change="updateDateFromBusinessDayMultiple"
                      class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1">
                      <option v-for="month in 12" :key="month" :value="month">
                        {{ getMonthName(month) }}
                      </option>
                    </select>
                    <select v-model="businessDayModeMultiple.year" @change="updateDateFromBusinessDayMultiple"
                      class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-20">
                      <option v-for="year in getYearOptions()" :key="year" :value="year">
                        {{ year }}
                      </option>
                    </select>
                  </div>
                  <select v-model="businessDayModeMultiple.dayNumber" @change="updateDateFromBusinessDayMultiple"
                    class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option v-for="day in 25" :key="day" :value="day">
                      {{ getBusinessDayDescription(day) }}
                    </option>
                  </select>
                  <div class="text-xs text-gray-600">📅 {{ formatDate(newRecord.Data) }}</div>
                </div>
                <button type="button"
                  @click="businessDayModeMultiple.enabled = !businessDayModeMultiple.enabled; if (businessDayModeMultiple.enabled) initBusinessDayModeMultiple(); else resetToDateInputMultiple()"
                  class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center"
                  :title="businessDayModeMultiple.enabled ? 'Usar data normal' : 'Usar dias úteis'">
                  {{ businessDayModeMultiple.enabled ? '📅' : '💼' }}
                </button>
              </div>
              <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text" placeholder="Descrição"
                class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
                inputClass="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
              <select v-model="newRecord.Tipo"
                class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="Receita">Receita</option>
                <option value="Despesa">Despesa</option>
              </select>
              <select v-model="newRecord.Categoria" @change="onCategoryChange"
                class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">🤖 Auto-detectar</option>
                <optgroup label="📂 Categorias">
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </optgroup>
              </select>
              <select v-model="newRecord.Status"
                class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="❌">❌</option>
                <option value="✔️">✔️</option>
              </select>
              <button @click="addMultipleRecord" type="button"
                class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
                <i class="fa fa-plus mr-1"></i>+
              </button>
            </div>

            <!-- Lista de registros adicionados -->
            <div v-if="multipleRecords.length > 0" class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-700">Registros a serem salvos:</h4>
              <div class="max-h-64 overflow-y-auto space-y-2">
                <div v-for="(record, index) in multipleRecords" :key="index"
                  class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <div class="flex-1 grid grid-cols-6 gap-2 text-sm">
                    <span>{{ formatDate(record.Data) }}</span>
                    <span class="font-medium flex items-center gap-1">
                      {{ record.Descrição }}
                      <span v-if="isRecurringRecord(record)" class="text-blue-500 text-xs" title="Registro recorrente">
                        <i class="fas fa-sync"></i>
                      </span>
                    </span>
                    <span :class="record.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
                      {{ record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                    </span>
                    <span class="text-xs px-2 py-1 rounded-full"
                      :class="record.Tipo === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                      {{ record.Tipo === 'Receita' ? '💰' : '💸' }} {{ record.Tipo }}
                    </span>
                    <span class="text-xs">{{ record.Categoria || 'Sem categoria' }}</span>
                    <span class="text-xs px-2 py-1 rounded-full"
                      :class="record.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                      {{ record.Status }}
                    </span>
                  </div>
                  <button @click="removeMultipleRecord(index)"
                    class="ml-2 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                    <i class="fas fa-times text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário Mobile -->
        <form @submit.prevent="handleAdd" class="lg:hidden p-4 space-y-4" v-if="!isMultipleMode">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <div class="relative">
                <input v-model="newRecord.Data" type="date" v-if="!businessDayMode.enabled"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required />
                <div v-else class="space-y-2">
                  <select v-model="businessDayMode.dayNumber" @change="updateDateFromBusinessDay"
                    class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option v-for="day in 25" :key="day" :value="day">
                      {{ getBusinessDayDescription(day) }}
                    </option>
                  </select>
                  <div class="text-xs text-gray-600 text-center">📅 {{ formatDate(newRecord.Data) }}</div>
                </div>
                <button type="button"
                  @click="businessDayMode.enabled = !businessDayMode.enabled; updateDateFromBusinessDay()"
                  class="absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center"
                  :title="businessDayMode.enabled ? 'Usar data normal' : 'Usar dias úteis'">
                  {{ businessDayMode.enabled ? '📅' : '💼' }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
                inputClass="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text"
              placeholder="Ex: Supermercado, Salário..."
              class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select v-model="newRecord.Tipo"
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required>
                <option value="Receita">💰 Receita</option>
                <option value="Despesa">💸 Despesa</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="newRecord.Status"
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required>
                <option value="❌">❌ Pendente</option>
                <option value="✔️">✔️ Confirmado</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select v-model="newRecord.Categoria" @change="onCategoryChange"
              class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">🤖 Auto-detectar categoria</option>
              <optgroup label="📂 Categorias Disponíveis">
                <option v-for="category in getAllCategories()" :key="category" :value="category">
                  {{ getCategoryIcon(category) }} {{ category }}
                </option>
              </optgroup>
            </select>
          </div>

          <button type="submit"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 font-semibold text-lg transition-colors shadow-lg">
            <i class="fa fa-plus mr-2"></i>
            Adicionar Registro
          </button>

          <!-- Recurrence Controls Mobile -->
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-700">
                🔄 Recorrência
              </h3>
              <label class="flex items-center">
                <input v-model="recurrence.isRecurring.value" type="checkbox" class="mr-2 rounded">
                <span class="text-sm text-gray-700">Recorrente</span>
              </label>
            </div>

            <div v-if="recurrence.isRecurring.value" class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Frequência</label>
                <select v-model="recurrence.recurrenceSettings.value.frequency"
                  class="w-full border border-gray-300 p-3 rounded-lg">
                  <option value="semanal">📅 Semanal</option>
                  <option value="quinzenal">📆 Quinzenal</option>
                  <option value="mensal">🗓️ Mensal</option>
                  <option value="trimestral">📊 Trimestral</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                <input v-model="recurrence.recurrenceSettings.value.endDate" type="date"
                  class="w-full border border-gray-300 p-3 rounded-lg">
              </div>
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-sm text-blue-800">
                  <div class="font-medium">📊 {{ recurrence.totalOccurrences.value }} ocorrências</div>
                  <div class="text-xs mt-1">{{ recurrence.recurrenceDescription.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Formulário Mobile - Múltiplos Registros -->
        <div class="lg:hidden p-4 space-y-4" v-if="isMultipleMode">
          <!-- Header com contador -->
          <div class="text-center">
            <span class="text-lg font-semibold text-gray-900">{{ multipleRecords.length }} registro{{
              multipleRecords.length !== 1 ? 's' : '' }} na lista</span>
          </div>

          <!-- Formulário para adicionar -->
          <div class="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <div class="relative">
                  <input v-model="newRecord.Data" type="date" v-if="!businessDayMode.enabled"
                    class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required />
                  <div v-else class="space-y-2">
                    <select v-model="businessDayMode.dayNumber" @change="updateDateFromBusinessDay"
                      class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option v-for="day in 25" :key="day" :value="day">
                        {{ getBusinessDayDescription(day) }}
                      </option>
                    </select>
                    <div class="text-xs text-gray-600 text-center">📅 {{ formatDate(newRecord.Data) }}</div>
                  </div>
                  <button type="button"
                    @click="businessDayMode.enabled = !businessDayMode.enabled; updateDateFromBusinessDay()"
                    class="absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center"
                    :title="businessDayMode.enabled ? 'Usar data normal' : 'Usar dias úteis'">
                    {{ businessDayMode.enabled ? '📅' : '💼' }}
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
                  inputClass="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input v-model="newRecord.Descrição" @input="onDescriptionChange" type="text" placeholder="Descrição..."
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select v-model="newRecord.Tipo"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                  <option value="Receita">💰</option>
                  <option value="Despesa">💸</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="newRecord.Status"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                  <option value="❌">❌</option>
                  <option value="✔️">✔️</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cat.</label>
                <select v-model="newRecord.Categoria" @change="onCategoryChange"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                  <option value="">🤖</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }}
                  </option>
                </select>
              </div>
            </div>

            <button @click="addMultipleRecord" type="button"
              class="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl p-3 font-semibold transition-colors">
              <i class="fas fa-plus mr-2"></i>Adicionar à Lista
            </button>
          </div>

          <!-- Lista de registros adicionados -->
          <div v-if="multipleRecords.length > 0" class="space-y-3">
            <h4 class="font-semibold text-gray-900">📋 Registros na Lista:</h4>
            <div class="max-h-64 overflow-y-auto space-y-2">
              <div v-for="(record, index) in multipleRecords" :key="index"
                class="bg-white p-3 rounded-lg border border-gray-200">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm text-gray-500">{{ formatDate(record.Data) }}</span>
                      <span class="text-xs px-2 py-1 rounded-full"
                        :class="record.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                        {{ record.Status }}
                      </span>
                    </div>
                    <h5 class="font-semibold text-gray-900 flex items-center gap-1">
                      {{ record.Descrição }}
                      <span v-if="isRecurringRecord(record)" class="text-blue-500 text-sm" title="Registro recorrente">
                        <i class="fas fa-sync"></i>
                      </span>
                    </h5>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-sm px-2 py-1 rounded-full"
                        :class="record.Tipo === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ record.Tipo === 'Receita' ? '💰' : '💸' }}
                      </span>
                      <span class="text-sm text-gray-600">{{ record.Categoria || 'Sem categoria' }}</span>
                    </div>
                  </div>
                  <div class="text-right ml-2">
                    <div :class="record.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="font-bold text-sm">
                      {{ record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                    </div>
                    <button @click="removeMultipleRecord(index)"
                      class="mt-1 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                      <i class="fas fa-times text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botões de ação -->
            <div class="flex gap-3">
              <button @click="clearMultipleRecords" type="button"
                class="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl p-3 font-semibold transition-colors">
                <i class="fas fa-trash mr-2"></i>Limpar
              </button>
              <button @click="saveAllMultipleRecords" type="button"
                class="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-3 font-semibold transition-colors">
                <i class="fas fa-save mr-2"></i>Salvar ({{ multipleRecords.length }})
              </button>
            </div>
          </div>
        </div>
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
          <div v-if="categoryFilter"
            class="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span class="text-sm text-orange-800">
              🔍 <strong>{{ getCategoryIcon(categoryFilter) }} {{ categoryFilter }}</strong>
            </span>
            <button @click="clearCategoryFilter" class="text-orange-600 hover:text-orange-800 ml-auto">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Botão de auto-categorização mobile -->
          <div v-if="getRecordsWithoutCategory().length > 0" class="mt-3">
            <button @click="refreshCategorization"
              class="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <i class="fas fa-robot"></i>
              <span>Auto-categorizar {{ getRecordsWithoutCategory().length }} registro{{
                getRecordsWithoutCategory().length > 1 ? 's' : '' }}</span>
            </button>
          </div>
        </div>

        <!-- Controles de Edição (Desktop) -->
        <div class="hidden lg:flex items-center justify-between p-4 bg-gray-50">
          <span class="text-sm text-gray-600">{{ filteredData.length }} registros encontrados</span>
          <div class="flex gap-2">
            <button @click="refreshCategorization"
              class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              :disabled="getRecordsWithoutCategory().length === 0"
              :title="`Detectar categorias para ${getRecordsWithoutCategory().length} registros sem categoria`">
              <i class="fas fa-robot text-xs"></i>
              <span>Auto-categorizar ({{ getRecordsWithoutCategory().length }})</span>
            </button>
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

        <!-- Month groups for mobile -->
        <template v-for="(monthData, monthKey) in groupedByMonth" :key="monthKey">
          <!-- Month header mobile -->
          <div class="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-blue-900 capitalize">
                📅 {{ monthData[0]?.monthName }}
              </h3>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <div class="text-sm text-blue-700">{{ monthData.length }} transações</div>
                  <div class="text-sm font-medium text-blue-800">
                    {{ getMonthTotal(monthData).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                  </div>
                </div>
                <!-- Quick hide button -->
                <button @click="hideMonth(monthKey)"
                  class="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-100 transition-colors"
                  title="Ocultar este mês do cálculo do saldo">
                  <i class="fas fa-eye-slash text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Month records for mobile -->
          <div v-for="(item, index) in monthData" :key="`${monthKey}-mobile-${index}`"
            class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <!-- Card Normal -->
            <div class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm text-gray-500">{{ formatDate(item.Data) }}</span>
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
                  <div :class="item.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="text-xl font-bold">
                    {{ item.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    Saldo: {{ (item.Saldo ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                  </div>
                </div>
              </div>

              <!-- Ações Mobile -->
              <div class="flex gap-2 pt-3 border-t border-gray-100">
                <button @click="openEditSheet(getGlobalIndex(item))"
                  class="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                  <i class="fas fa-edit mr-1"></i> Editar
                </button>
                <button @click="confirmDelete(getGlobalIndex(item))"
                  class="bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Tabela Desktop -->
      <section class="hidden lg:block overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
        <table class="w-full table-auto">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th @click="setSorting('Data')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Data</span>
                  <i :class="getSortIcon('Data')"></i>
                </div>
              </th>
              <th @click="setSorting('Descrição')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Descrição</span>
                  <i :class="getSortIcon('Descrição')"></i>
                </div>
              </th>
              <th @click="setSorting('Valor')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Valor (R$)</span>
                  <i :class="getSortIcon('Valor')"></i>
                </div>
              </th>
              <th @click="setSorting('Tipo')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Tipo</span>
                  <i :class="getSortIcon('Tipo')"></i>
                </div>
              </th>
              <th @click="setSorting('Categoria')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Categoria</span>
                  <i :class="getSortIcon('Categoria')"></i>
                </div>
              </th>
              <th @click="setSorting('Status')"
                class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-1">
                  <span>Status</span>
                  <i :class="getSortIcon('Status')"></i>
                </div>
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Month groups -->
            <template v-for="(monthData, monthKey) in groupedByMonth" :key="monthKey">
              <!-- Month header -->
              <tr class="bg-blue-50">
                <td colspan="8" class="px-6 py-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-blue-900 capitalize">
                      📅 {{ monthData[0]?.monthName }}
                    </h3>
                    <div class="flex items-center space-x-4 text-sm text-blue-700">
                      <span>{{ monthData.length }} transações</span>
                      <span class="font-medium">
                        Total: {{ getMonthTotal(monthData).toLocaleString('pt-BR', {
                          style: 'currency', currency: 'BRL'
                        }) }}
                      </span>
                    </div>
                    <!-- Quick hide button -->
                    <button @click="hideMonth(monthKey)"
                      class="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-100 transition-colors"
                      title="Ocultar este mês do cálculo do saldo">
                      <i class="fas fa-eye-slash text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Month records -->
              <tr v-for="(item, index) in monthData" :key="`${monthKey}-${index}`">
                <td class="px-4 py-2">{{ formatDate(item.Data) }}</td>
                <td class="px-4 py-2">{{ item.Descrição }}</td>
                <td :class="item.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="px-4 py-2">
                  {{ item.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </td>
                <td class="px-4 py-2">
                  <span :class="item.Tipo === 'Receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ item.Tipo === 'Receita' ? '💰' : '💸' }} {{ item.Tipo }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <span v-if="item.Categoria">
                    {{ getCategoryIcon(item.Categoria) }} {{ item.Categoria }}
                  </span>
                  <span v-else class="text-gray-400 italic">Sem categoria</span>
                </td>
                <td class="px-4 py-2">
                  <span :class="item.Status === '✔️' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'"
                    class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ item.Status }}
                  </span>
                </td>
                <td :class="(item.Saldo ?? 0) < 0 ? 'text-red-600' : 'text-green-600'" class="px-4 py-2 font-medium">
                  {{ (item.Saldo ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </td>
                <td class="px-4 py-2">
                  <button @click="openEditSheet(getGlobalIndex(item))"
                    class="text-yellow-600 px-2 hover:text-yellow-800" title="Editar este item">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button @click="confirmDelete(getGlobalIndex(item))" class="text-red-600 px-2 hover:text-red-800"
                    title="Excluir este item">
                    <i class="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </section>

      <!-- Saldo Final Desktop -->
      <div class="hidden lg:block">
        <div class="text-center p-4 bg-white rounded-2xl border border-gray-200">
          <div :class="saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" class="text-xl font-bold">
            Saldo Final: {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </div>
          <!-- Hidden months indicator -->
          <div v-if="getHiddenMonthsCount() > 0" class="mt-2">
            <span class="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
              <i class="fas fa-eye-slash mr-1"></i>
              {{ getHiddenMonthsCount() }} mês{{ getHiddenMonthsCount() > 1 ? 'es' : '' }} excluído{{
                getHiddenMonthsCount() > 1 ? 's' : '' }} do cálculo
            </span>
          </div>
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
            <div v-for="(total, category) in getCategoryTotals()" :key="category"
              :class="total < 0 ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-green-50 border-green-200 hover:bg-green-100'"
              class="p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-95"
              @click="filterByCategory(category)">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-gray-900 truncate">
                      {{ getCategoryIcon(category) }} {{ category }}
                    </span>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full inline-block"
                    :class="total < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                    {{ total < 0 ? '💸 Despesa' : '💰 Receita' }} </span>
                </div>
                <div class="text-right ml-2">
                  <div :class="total < 0 ? 'text-red-600' : 'text-green-600'" class="font-bold text-lg">
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
      <div v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click="cancelDelete">
        <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all modal-content"
          @click.stop>
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
              <div class="text-sm text-gray-800 font-medium flex items-center gap-1">
                {{ itemToDelete.record.Descrição }}
                <span v-if="isRecurringRecord(itemToDelete.record)" class="text-blue-500 text-xs"
                  title="Registro recorrente">
                  <i class="fas fa-sync"></i>
                </span>
              </div>
              <div class="text-sm text-gray-600">{{ itemToDelete.record.Data }}</div>
              <div :class="itemToDelete.record.Valor < 0 ? 'text-red-600' : 'text-green-600'"
                class="text-sm font-semibold">
                {{ itemToDelete.record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="cancelDelete"
                class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button @click="executeDelete"
                class="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
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
      <div v-if="showUndoToast" class="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50">
        <div class="bg-gray-800 text-white rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <i class="fas fa-check text-white text-sm"></i>
            </div>
            <div>
              <div class="font-medium">Registro excluído</div>
              <div v-if="deletedItem" class="text-sm text-gray-300 truncate flex items-center gap-1">
                {{ deletedItem.record.Descrição }}
                <span v-if="isRecurringRecord(deletedItem.record)" class="text-blue-400 text-xs"
                  title="Registro recorrente">
                  <i class="fas fa-sync"></i>
                </span>
              </div>
              <div class="text-xs text-gray-400">
                {{ undoTimeLeft }}s restantes
              </div>
            </div>
          </div>

          <div class="flex gap-2 ml-4">
            <button @click="undoDelete"
              class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-undo mr-1"></i>
              Desfazer
            </button>
            <button @click="hideUndoToast" class="text-gray-300 hover:text-white p-1">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Sheet Drawer para Edição Individual -->
    <Transition name="sheet">
      <div v-if="editingRecord"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end lg:items-center justify-center z-50 p-0 lg:p-4"
        @click="closeEditSheet">
        <div
          class="bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] lg:max-h-[85vh] overflow-hidden sheet-content flex flex-col"
          @click.stop>
          <!-- Header do Sheet -->
          <div class="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-edit text-blue-600"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Editar Registro</h3>
                <p class="text-sm text-gray-600">Modifique os dados conforme necessário</p>
              </div>
            </div>
            <button @click="closeEditSheet"
              class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <i class="fas fa-times text-gray-600"></i>
            </button>
          </div>

          <!-- Conteúdo do Sheet -->
          <div class="p-6 overflow-y-auto flex-1 min-h-0">
            <form @submit.prevent="saveEditSheet" class="space-y-6">
              <!-- Linha 1: Data e Valor -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-calendar mr-2 text-blue-500"></i>Data
                  </label>
                  <div class="relative">
                    <input v-model="editingRecord.Data" type="date" v-if="!businessDayModeEdit.enabled"
                      class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required />
                    <div v-else class="space-y-2">
                      <div class="flex gap-2">
                        <select v-model="businessDayModeEdit.month" @change="updateDateFromBusinessDayEdit"
                          class="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm flex-1">
                          <option v-for="month in 12" :key="month" :value="month">
                            {{ getMonthName(month) }}
                          </option>
                        </select>
                        <select v-model="businessDayModeEdit.year" @change="updateDateFromBusinessDayEdit"
                          class="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-24">
                          <option v-for="year in getYearOptions()" :key="year" :value="year">
                            {{ year }}
                          </option>
                        </select>
                      </div>
                      <select v-model="businessDayModeEdit.dayNumber" @change="updateDateFromBusinessDayEdit"
                        class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                        <option v-for="day in 25" :key="day" :value="day">
                          {{ getBusinessDayDescription(day) }}
                        </option>
                      </select>
                      <div class="text-xs text-gray-600 text-center">📅 {{ formatDate(editingRecord.Data) }}</div>
                    </div>
                    <button type="button"
                      @click="businessDayModeEdit.enabled = !businessDayModeEdit.enabled; updateDateFromBusinessDayEdit()"
                      class="absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center"
                      :title="businessDayModeEdit.enabled ? 'Usar data normal' : 'Usar dias úteis'">
                      {{ businessDayModeEdit.enabled ? '📅' : '💼' }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-dollar-sign mr-2 text-green-500"></i>Valor
                  </label>
                  <CurrencyInput v-model="editingRecord.Valor" :tipo="editingRecord.Tipo" placeholder="R$ 0,00"
                    inputClass="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required />
                </div>
              </div>

              <!-- Linha 2: Descrição -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-align-left mr-2 text-purple-500"></i>Descrição
                </label>
                <input v-model="editingRecord.Descrição" type="text" placeholder="Descreva o registro..."
                  class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required />
              </div>

              <!-- Linha 3: Tipo e Status -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-tag mr-2 text-orange-500"></i>Tipo
                  </label>
                  <select v-model="editingRecord.Tipo"
                    class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    required>
                    <option value="Receita">💰 Receita</option>
                    <option value="Despesa">💸 Despesa</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-check-circle mr-2 text-green-500"></i>Status
                  </label>
                  <select v-model="editingRecord.Status"
                    class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    required>
                    <option value="❌">❌ Pendente</option>
                    <option value="✔️">✔️ Confirmado</option>
                  </select>
                </div>
              </div>

              <!-- Linha 4: Categoria -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-folder mr-2 text-indigo-500"></i>Categoria
                </label>
                <select v-model="editingRecord.Categoria"
                  class="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option value="">📋 Sem categoria</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
              </div>

              <!-- Configurações de Recorrência para Edição -->
              <div class="border-t border-gray-200 pt-6">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-semibold text-gray-700 flex items-center">
                    <i class="fas fa-repeat mr-2 text-purple-500"></i>Configurações de Recorrência
                  </h4>
                  <label class="flex items-center">
                    <input v-model="editRecurrence.isActive" type="checkbox" class="mr-2 rounded">
                    <span class="text-sm text-gray-700">Tornar recorrente</span>
                  </label>
                </div>

                <div v-if="editRecurrence.isActive" class="space-y-4">
                  <!-- Warning se já existe recorrência similar -->
                  <div v-if="existingRecurrenceWarning" class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div class="flex items-start">
                      <i class="fas fa-exclamation-triangle text-orange-500 mr-2 mt-0.5"></i>
                      <div class="flex-1">
                        <h5 class="text-sm font-medium text-orange-800 mb-1">Recorrência Similar Detectada</h5>
                        <p class="text-sm text-orange-700 mb-2">
                          Já existe uma recorrência para "{{ existingRecurrenceWarning.description }}"
                          com frequência {{ existingRecurrenceWarning.frequency }}.
                        </p>
                        <div class="flex gap-2">
                          <button @click="confirmOverwriteRecurrence" type="button"
                            class="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg">
                            Sobrescrever
                          </button>
                          <button @click="cancelEditRecurrence" type="button"
                            class="text-xs bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-lg">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Frequência</label>
                      <select v-model="editRecurrence.frequency" @change="checkExistingRecurrence"
                        class="w-full border border-gray-300 rounded-lg p-3 text-sm">
                        <option value="semanal">📅 Semanal</option>
                        <option value="quinzenal">📆 Quinzenal</option>
                        <option value="mensal">🗓️ Mensal</option>
                        <option value="trimestral">📊 Trimestral</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Data Final</label>
                      <input v-model="editRecurrence.endDate" type="date"
                        class="w-full border border-gray-300 rounded-lg p-3 text-sm">
                    </div>
                  </div>

                  <!-- Preview da recorrência -->
                  <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div class="text-sm text-purple-800">
                      <div class="font-medium flex items-center">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        {{ getEditRecurrenceOccurrences() }} ocorrências programadas
                      </div>
                      <div class="text-xs mt-1">{{ getEditRecurrenceDescription() }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Preview do Registro -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <i class="fas fa-eye mr-2"></i>Preview do Registro
                </h4>
                <div class="bg-white rounded-lg p-4 border">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm text-gray-500">{{ formatDate(editingRecord.Data) }}</span>
                        <span class="text-xs px-2 py-1 rounded-full"
                          :class="editingRecord.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                          {{ editingRecord.Status === '✔️' ? '✔️ Confirmado' : '❌ Pendente' }}
                        </span>
                      </div>
                      <h5 class="font-semibold text-gray-900">{{ editingRecord.Descrição || 'Digite uma descrição...' }}
                      </h5>
                      <div class="text-sm text-gray-600 mt-1">
                        <span v-if="editingRecord.Categoria">
                          {{ getCategoryIcon(editingRecord.Categoria) }} {{ editingRecord.Categoria }}
                        </span>
                        <span v-else class="italic">Sem categoria</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div :class="editingRecord.Valor < 0 ? 'text-red-600' : 'text-green-600'"
                        class="text-xl font-bold">
                        {{ (editingRecord.Valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ editingRecord.Tipo === 'Receita' ? '💰' : '💸' }} {{ editingRecord.Tipo }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botões de Ação -->
              <div class="flex gap-3 pt-4">
                <button type="button" @click="closeEditSheet"
                  class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 px-4 font-medium transition-colors">
                  <i class="fas fa-times mr-2"></i>
                  Cancelar
                </button>
                <button type="submit"
                  class="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 px-4 font-medium transition-colors shadow-lg">
                  <i class="fas fa-save mr-2"></i>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useFinance } from '../composables/useFinance';
import { useCategoryDetection } from '../composables/useCategoryDetection';
import CSVImport from './CSVImport.vue';
import CurrencyInput from './CurrencyInput.vue';
import DatePicker from './DatePicker.vue';
import Chart from 'chart.js/auto';
import type { IFinanceRecord } from '../types/finance';
import MonthVisibilityManager from './MonthVisibilityManager.vue';
import StateDebugger from './StateDebugger.vue';

export default {
  name: 'FinanceTable',
  components: {
    CSVImport,
    CurrencyInput,
    DatePicker,
    MonthVisibilityManager,
    StateDebugger,
  },
  setup() {
    const {
      data,
      filteredData,
      groupedByMonth,
      saldoFinal,
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
      setSorting,
      getSortIcon,
      recurrence,
      allAvailableMonths,
      showAllMonths,
      toggleMonthVisibility,
      getHiddenMonthsCount,
      hideMonth: hideMonthFromComposable,
      getStateSnapshot,
      clearAllData,
    } = useFinance();

    const { detectCategory, getAllCategories } = useCategoryDetection();

    // Função para obter data atual no formato YYYY-MM-DD
    function getCurrentDate(): string {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    // Função para formatar data como DD/MM/YYYY
    function formatDateDisplay(dateStr: string): string {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    }

    // Função para converter DD/MM/YYYY para YYYY-MM-DD
    function parseDateInput(dateStr: string): string {
      if (!dateStr) return '';

      // Se já está no formato YYYY-MM-DD, retorna como está
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }

      // Se está no formato DD/MM/YYYY, converte
      const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      return dateStr;
    }

    // Estados necessários
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

    // Estados para confirmação de exclusão e undo
    const showDeleteConfirm = ref<boolean>(false);
    const itemToDelete = ref<{ index: number; record: IFinanceRecord } | null>(null);
    const deletedItem = ref<{ index: number; record: IFinanceRecord } | null>(null);
    const showUndoToast = ref<boolean>(false);
    const undoTimeout = ref<number | null>(null);
    const undoTimeLeft = ref<number>(5);

    // Estado para o sheet drawer de edição individual
    const editingRecord = ref<IFinanceRecord | null>(null);
    const originalEditIndex = ref<number>(-1);

    // Estado para o modo de múltiplos registros
    const isMultipleMode = ref<boolean>(false);
    const multipleRecords = ref<IFinanceRecord[]>([]);

    // Estado para recorrência durante edição
    const editRecurrence = reactive({
      isActive: false,
      frequency: 'mensal' as 'semanal' | 'quinzenal' | 'mensal' | 'trimestral',
      endDate: ''
    });

    // Estado para warning de recorrência existente
    const existingRecurrenceWarning = ref<{
      description: string;
      frequency: string;
      originalRecord?: any;
    } | null>(null);

    // Business day mode states and functions
    const businessDayMode = reactive({
      enabled: false,
      dayNumber: 1,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    const businessDayModeMultiple = reactive({
      enabled: false,
      dayNumber: 1,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    const businessDayModeEdit = reactive({
      enabled: false,
      dayNumber: 1,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    function calculateBusinessDay(year: number, month: number, dayNumber: number): string {
      const date = new Date(year, month - 1, 1);
      let businessDaysCount = 0;

      while (businessDaysCount < dayNumber) {
        if (date.getDay() !== 0 && date.getDay() !== 6) { // Not Sunday (0) or Saturday (6)
          businessDaysCount++;
        }
        if (businessDaysCount < dayNumber) {
          date.setDate(date.getDate() + 1);
        }
      }

      return date.toISOString().split('T')[0];
    }

    function updateDateFromBusinessDay() {
      if (businessDayMode.enabled) {
        const calculatedDate = calculateBusinessDay(businessDayMode.year, businessDayMode.month, businessDayMode.dayNumber);
        newRecord.Data = calculatedDate;
      }
    }

    function updateDateFromBusinessDayMultiple() {
      if (businessDayModeMultiple.enabled) {
        const calculatedDate = calculateBusinessDay(businessDayModeMultiple.year, businessDayModeMultiple.month, businessDayModeMultiple.dayNumber);
        newRecord.Data = calculatedDate;
      }
    }

    function updateDateFromBusinessDayEdit() {
      if (businessDayModeEdit.enabled && editingRecord.value) {
        const calculatedDate = calculateBusinessDay(businessDayModeEdit.year, businessDayModeEdit.month, businessDayModeEdit.dayNumber);
        editingRecord.value.Data = calculatedDate;
      }
    }

    function getBusinessDayDescription(dayNumber: number): string {
      const descriptions = [
        '', '1º dia útil', '2º dia útil', '3º dia útil', '4º dia útil', '5º dia útil',
        '6º dia útil', '7º dia útil', '8º dia útil', '9º dia útil', '10º dia útil',
        '11º dia útil', '12º dia útil', '13º dia útil', '14º dia útil', '15º dia útil',
        '16º dia útil', '17º dia útil', '18º dia útil', '19º dia útil', '20º dia útil',
        '21º dia útil', '22º dia útil', '23º dia útil', '24º dia útil', '25º dia útil'
      ];
      return descriptions[dayNumber] || `${dayNumber}º dia útil`;
    }

    function handleAdd() {
      if (!newRecord.Data || !newRecord.Descrição || !newRecord.Valor) return;

      // Detectar categoria automaticamente se não estiver preenchida
      const categoria = newRecord.Categoria || detectCategory(newRecord.Descrição);

      if (isMultipleMode.value) {
        addMultipleRecord();
      } else {
        addRecord({
          ...newRecord,
          Tipo: newRecord.Tipo as 'Receita' | 'Despesa',
          Status: newRecord.Status as '❌' | '✔️',
          Categoria: categoria
        });
      }

      Object.assign(newRecord, {
        Data: getCurrentDate(),
        Descrição: '',
        Valor: 0,
        Tipo: 'Receita',
        Categoria: '',
        Status: '❌',
      });
    }

    function addMultipleRecord() {
      if (!newRecord.Data || !newRecord.Descrição || !newRecord.Valor) return;

      const categoria = newRecord.Categoria || detectCategory(newRecord.Descrição);

      multipleRecords.value.push({
        ...newRecord,
        Tipo: newRecord.Tipo as 'Receita' | 'Despesa',
        Status: newRecord.Status as '❌' | '✔️',
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

    function saveAllMultipleRecords() {
      if (multipleRecords.value.length === 0) return;

      multipleRecords.value.forEach(record => {
        const categoria = record.Categoria || detectCategory(record.Descrição);
        addRecord({
          ...record,
          Tipo: record.Tipo as 'Receita' | 'Despesa',
          Status: record.Status as '❌' | '✔️',
          Categoria: categoria
        });
      });
      multipleRecords.value = [];
    }

    function clearMultipleRecords() {
      multipleRecords.value = [];
    }

    function removeMultipleRecord(index: number) {
      multipleRecords.value.splice(index, 1);
    }

    // Detectar categoria quando descrição muda
    function onDescriptionChange() {
      if (newRecord.Descrição && !newRecord.Categoria) {
        const detectedCategory = detectCategory(newRecord.Descrição);
        if (detectedCategory && detectedCategory !== 'Outros') {
          newRecord.Categoria = detectedCategory;
        }
      }
    }

    function onCategoryChange() {
      // Previne conflitos
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

      data.value.forEach(item => {
        const category = item.Categoria || 'Sem categoria';
        if (!totals[category]) {
          totals[category] = 0;
        }
        totals[category] += item.Valor;
      });

      const filteredTotals = Object.fromEntries(
        Object.entries(totals).filter(([, value]) => value !== 0)
      );

      const sortedEntries = Object.entries(filteredTotals)
        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

      return Object.fromEntries(sortedEntries);
    }

    function handleImport(records: Omit<IFinanceRecord, 'Saldo'>[]) {
      importRecords(records);
    }

    function filterByCategory(category: string) {
      setCategoryFilter(category);
    }

    function getMonthTotal(monthData: IFinanceRecord[]): number {
      return monthData.reduce((total, record) => total + record.Valor, 0);
    }

    function getGlobalIndex(item: IFinanceRecord): number {
      return filteredData.value.findIndex(record =>
        record.Data === item.Data &&
        record.Descrição === item.Descrição &&
        record.Valor === item.Valor
      );
    }

    function formatDate(dateStr: string): string {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
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

      deletedItem.value = { index, record };
      removeRecord(index);

      showUndoToast.value = true;
      undoTimeLeft.value = 5;

      const countdown = setInterval(() => {
        undoTimeLeft.value--;
        if (undoTimeLeft.value <= 0) {
          clearInterval(countdown);
        }
      }, 1000);

      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
      }
      undoTimeout.value = setTimeout(() => {
        clearInterval(countdown);
        hideUndoToast();
      }, 5000);

      showDeleteConfirm.value = false;
      itemToDelete.value = null;
    }

    function undoDelete() {
      if (!deletedItem.value) return;

      const { index, record } = deletedItem.value;
      data.value.splice(index, 0, record);
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

    function hideMonth(monthKey: string) {
      hideMonthFromComposable(monthKey);
    }

    // Função para abrir o sheet de edição
    function openEditSheet(index: number) {
      const record = filteredData.value[index];
      editingRecord.value = { ...record };
      originalEditIndex.value = index;

      // Load existing recurrence settings from the record
      if (record.recurrence && record.recurrence.isActive) {
        console.log('📄 [EDIT_MODAL] Loading existing recurrence settings:', record.recurrence);
        editRecurrence.isActive = true;
        editRecurrence.frequency = record.recurrence.frequency;
        editRecurrence.endDate = record.recurrence.endDate;
      } else {
        console.log('📄 [EDIT_MODAL] No existing recurrence found, setting defaults');
        editRecurrence.isActive = false;
        editRecurrence.frequency = 'mensal';
        editRecurrence.endDate = '';
      }

      existingRecurrenceWarning.value = null;

      // Initialize business day mode for edit based on current date
      if (editingRecord.value) {
        const currentDate = new Date(editingRecord.value.Data);
        businessDayModeEdit.month = currentDate.getMonth() + 1;
        businessDayModeEdit.year = currentDate.getFullYear();
        businessDayModeEdit.enabled = false; // Start with normal date input
      }
    }

    function closeEditSheet() {
      editingRecord.value = null;
      originalEditIndex.value = -1;
    }

    function saveEditSheet() {
      if (!editingRecord.value) return;

      const index = originalEditIndex.value;
      if (index === -1) return;

      if (editRecurrence.isActive) {
        processEditRecurrence();
      } else {
        updateRecord(index, editingRecord.value);
        closeEditSheet();
      }
    }

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
      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
      }
    });

    // Função para recorrência durante edição
    function checkExistingRecurrence() {
      if (!editingRecord.value || !editRecurrence.isActive) return;

      const similar = data.value.find(record =>
        record.Descrição.toLowerCase().includes(editingRecord.value!.Descrição.toLowerCase()) ||
        editingRecord.value!.Descrição.toLowerCase().includes(record.Descrição.toLowerCase())
      );

      if (similar && similar !== editingRecord.value) {
        existingRecurrenceWarning.value = {
          description: similar.Descrição,
          frequency: editRecurrence.frequency,
          originalRecord: similar
        };
      } else {
        existingRecurrenceWarning.value = null;
      }
    }

    function confirmOverwriteRecurrence() {
      existingRecurrenceWarning.value = null;
      processEditRecurrence();
    }

    function cancelEditRecurrence() {
      editRecurrence.isActive = false;
      existingRecurrenceWarning.value = null;
    }

    function processEditRecurrence() {
      console.log('🔄 [EDIT_RECURRENCE] Starting edit recurrence process');

      if (!editingRecord.value) {
        console.log('❌ [EDIT_RECURRENCE] No editing record found');
        return;
      }

      const filteredIndex = originalEditIndex.value;
      if (filteredIndex === -1) {
        console.log('❌ [EDIT_RECURRENCE] Invalid filtered index');
        return;
      }

      const currentRecord = filteredData.value[filteredIndex];
      if (!currentRecord) {
        console.log('❌ [EDIT_RECURRENCE] Current record not found at index:', filteredIndex);
        return;
      }

      console.log('🔄 [EDIT_RECURRENCE] Current record found:', {
        originalDate: currentRecord.Data,
        newDate: editingRecord.value.Data,
        description: editingRecord.value.Descrição,
        frequency: editRecurrence.frequency,
        endDate: editRecurrence.endDate
      });

      const originalSettings = { ...recurrence.recurrenceSettings.value };
      const originalIsRecurring = recurrence.isRecurring.value;

      console.log('🔄 [EDIT_RECURRENCE] Original recurrence state:', {
        isRecurring: originalIsRecurring,
        settings: originalSettings
      });

      recurrence.isRecurring.value = true;
      recurrence.recurrenceSettings.value = {
        frequency: editRecurrence.frequency,
        endDate: editRecurrence.endDate || getDefaultEndDateForEdit(),
        isActive: true
      };

      console.log('🔄 [EDIT_RECURRENCE] New recurrence settings applied:', {
        frequency: recurrence.recurrenceSettings.value.frequency,
        endDate: recurrence.recurrenceSettings.value.endDate,
        isActive: recurrence.recurrenceSettings.value.isActive
      });

      const recordToUpdate = {
        Data: editingRecord.value.Data,
        Descrição: editingRecord.value.Descrição,
        Valor: editingRecord.value.Valor,
        Tipo: editingRecord.value.Tipo as 'Receita' | 'Despesa',
        Categoria: editingRecord.value.Categoria || '',
        Status: editingRecord.value.Status as '❌' | '✔️'
      };

      console.log('🔄 [EDIT_RECURRENCE] Record to update:', recordToUpdate);

      const updateSuccess = updateRecord(filteredIndex, recordToUpdate);

      console.log('🔄 [EDIT_RECURRENCE] Update result:', updateSuccess);

      if (updateSuccess) {
        console.log('🔄 [EDIT_RECURRENCE] Generating recurring records...');
        const recordsToAdd = recurrence.generateRecurringRecords(recordToUpdate);

        console.log('🔄 [EDIT_RECURRENCE] Generated records:', {
          totalCount: recordsToAdd.length,
          futureRecordsCount: recordsToAdd.length - 1,
          allDates: recordsToAdd.map(r => r.Data)
        });

        console.log('📊 [EDIT_RECURRENCE] Data state BEFORE adding future records:', {
          totalRecords: data.value.length,
          recordsWithDescription: data.value.filter(r => r.Descrição.includes(recordToUpdate.Descrição)).length,
          existingDates: data.value.filter(r => r.Descrição.includes(recordToUpdate.Descrição)).map(r => r.Data).sort()
        });

        if (recordsToAdd.length > 1) {
          const futureRecords = recordsToAdd.slice(1);

          console.log('🔄 [EDIT_RECURRENCE] Adding future records:', futureRecords.length);

          // Log before adding each record
          const initialCount = data.value.length;
          console.log('📊 [EDIT_RECURRENCE] Initial data.value length:', initialCount);

          futureRecords.forEach((record, index) => {
            const newRecord = {
              Data: record.Data,
              Descrição: record.Descrição,
              Valor: record.Valor,
              Tipo: record.Tipo as 'Receita' | 'Despesa',
              Status: record.Status as '❌' | '✔️',
              Categoria: record.Categoria
            };

            console.log(`🔄 [EDIT_RECURRENCE] Adding future record #${index + 1}:`, newRecord);

            data.value.push(newRecord);
            console.log(`📊 [EDIT_RECURRENCE] Data length after adding record #${index + 1}:`, data.value.length);
          });

          console.log('✅ [EDIT_RECURRENCE] All future records added successfully');

          // Wait for Vue reactivity to complete
          nextTick(() => {
            console.log('📊 [EDIT_RECURRENCE] Data state AFTER nextTick:', {
              totalRecords: data.value.length,
              recordsWithDescription: data.value.filter(r => r.Descrição.includes(recordToUpdate.Descrição)).length,
              allDatesWithDescription: data.value.filter(r => r.Descrição.includes(recordToUpdate.Descrição)).map(r => r.Data).sort(),
              septemberRecords: data.value.filter(r => r.Data.startsWith('2025-09') && r.Descrição.includes(recordToUpdate.Descrição)),
              filteredDataCount: filteredData.value.length,
              groupedByMonthKeys: Object.keys(groupedByMonth.value)
            });

            // Check specific September data
            const sept2025Group = groupedByMonth.value['setembro 2025'];
            console.log('📅 [EDIT_RECURRENCE] September 2025 group in groupedByMonth:', {
              exists: !!sept2025Group,
              recordCount: sept2025Group?.length || 0,
              records: sept2025Group || []
            });

            // Force a re-render by triggering filteredData recalculation
            console.log('🔄 [EDIT_RECURRENCE] Forcing reactivity update...');
            filter.value = filter.value; // Trigger reactivity
          });

        } else {
          console.log('ℹ️ [EDIT_RECURRENCE] No future records to add (only base record)');
        }
      } else {
        console.log('❌ [EDIT_RECURRENCE] Failed to update base record');
      }

      // Restore original settings
      recurrence.isRecurring.value = originalIsRecurring;
      recurrence.recurrenceSettings.value = originalSettings;

      console.log('🔄 [EDIT_RECURRENCE] Restored original recurrence settings');
      console.log('✅ [EDIT_RECURRENCE] Process completed');

      closeEditSheet();
    }

    function getDefaultEndDateForEdit(): string {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString().split('T')[0];
    }

    function getEditRecurrenceOccurrences(): number {
      if (!editRecurrence.isActive || !editingRecord.value) return 0;

      const startDate = new Date(editingRecord.value.Data);
      const endDate = editRecurrence.endDate ? new Date(editRecurrence.endDate) : new Date(getDefaultEndDateForEdit());

      let count = 1;
      let currentDate = new Date(startDate);

      while (currentDate < endDate) {
        switch (editRecurrence.frequency) {
          case 'semanal':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'quinzenal':
            currentDate.setDate(currentDate.getDate() + 15);
            break;
          case 'mensal':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'trimestral':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
        }
        if (currentDate <= endDate) count++;
      }

      return count;
    }

    function getEditRecurrenceDescription(): string {
      if (!editRecurrence.isActive) return '';

      const frequencies = {
        semanal: 'toda semana',
        quinzenal: 'a cada 15 dias',
        mensal: 'todo mês',
        trimestral: 'a cada 3 meses'
      };

      const endDateText = editRecurrence.endDate
        ? ` até ${new Date(editRecurrence.endDate).toLocaleDateString('pt-BR')}`
        : ' por 1 ano';

      return `Repetir ${frequencies[editRecurrence.frequency]}${endDateText}`;
    }

    function getRecordsWithoutCategory(): IFinanceRecord[] {
      return data.value.filter(record => !record.Categoria);
    }

    function refreshCategorization() {
      const recordsWithoutCategory = getRecordsWithoutCategory();

      console.log('🤖 [AUTO_CATEGORIZE] Starting auto-categorization process');
      console.log('🤖 [AUTO_CATEGORIZE] Records without category:', {
        count: recordsWithoutCategory.length,
        records: recordsWithoutCategory.map(r => ({ date: r.Data, description: r.Descrição }))
      });

      if (recordsWithoutCategory.length === 0) {
        console.log('ℹ️ [AUTO_CATEGORIZE] No records need categorization');
        return;
      }

      let updatedCount = 0;
      const categorizations: Array<{ record: string, detectedCategory: string }> = [];

      recordsWithoutCategory.forEach(record => {
        const detectedCategory = detectCategory(record.Descrição);

        console.log('🤖 [AUTO_CATEGORIZE] Processing record:', {
          description: record.Descrição,
          detectedCategory,
          willUpdate: detectedCategory && detectedCategory !== 'Outros'
        });

        if (detectedCategory && detectedCategory !== 'Outros') {
          // Find the record in the data array and update it
          const recordIndex = data.value.findIndex(r =>
            r.Data === record.Data &&
            r.Descrição === record.Descrição &&
            r.Valor === record.Valor
          );

          if (recordIndex !== -1) {
            data.value[recordIndex].Categoria = detectedCategory;
            updatedCount++;
            categorizations.push({
              record: record.Descrição,
              detectedCategory
            });
            console.log('✅ [AUTO_CATEGORIZE] Updated record:', {
              index: recordIndex,
              description: record.Descrição,
              newCategory: detectedCategory
            });
          } else {
            console.log('❌ [AUTO_CATEGORIZE] Record not found in data array:', record);
          }
        }
      });

      // Show detailed feedback to user
      console.log('🤖 [AUTO_CATEGORIZE] Process complete:', {
        totalProcessed: recordsWithoutCategory.length,
        successfullyUpdated: updatedCount,
        categorizations
      });

      if (updatedCount > 0) {
        console.log(`✅ [AUTO_CATEGORIZE] ${updatedCount} registro${updatedCount > 1 ? 's' : ''} categorizado${updatedCount > 1 ? 's' : ''} automaticamente!`);
        console.log('📋 [AUTO_CATEGORIZE] Categorizations applied:', categorizations);
      } else {
        console.log('ℹ️ [AUTO_CATEGORIZE] Nenhum registro pôde ser categorizado automaticamente.');
        console.log('💡 [AUTO_CATEGORIZE] Tip: Make sure record descriptions contain recognizable keywords');
      }
    }

    // Debug function to check for specific records
    function debugCheckRecord(description: string, month: string) {
      console.log(`🔍 [DEBUG] Checking for records containing "${description}" in ${month}:`);

      const matchingRecords = data.value.filter(record => {
        const recordDate = new Date(record.Data);
        const recordMonth = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, '0')}`;
        return record.Descrição.includes(description) && recordMonth === month;
      });

      console.log(`🔍 [DEBUG] Found ${matchingRecords.length} matching records:`, matchingRecords);

      // Check if month is hidden
      const isMonthHidden = getHiddenMonthsCount() > 0; // Simplified check
      console.log(`🔍 [DEBUG] Is ${month} hidden?`, isMonthHidden);

      // Check current filters
      console.log(`🔍 [DEBUG] Current filters:`, {
        filter: filter.value,
        categoryFilter: categoryFilter.value
      });

      // Check filteredData
      const filteredMatching = filteredData.value.filter(record => {
        const recordDate = new Date(record.Data);
        const recordMonth = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, '0')}`;
        return record.Descrição.includes(description) && recordMonth === month;
      });

      console.log(`🔍 [DEBUG] Found ${filteredMatching.length} in filteredData:`, filteredMatching);

      return {
        totalInData: matchingRecords.length,
        totalInFiltered: filteredMatching.length,
        isMonthHidden,
        records: matchingRecords
      };
    }

    function getMonthName(monthNumber: number): string {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return months[monthNumber - 1] || '';
    }

    function getYearOptions(): number[] {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = currentYear - 2; year <= currentYear + 5; year++) {
        years.push(year);
      }
      return years;
    }

    function initBusinessDayMode() {
      // Initialize business day mode with current date values
      const currentDate = new Date(newRecord.Data || new Date());
      businessDayMode.month = currentDate.getMonth() + 1;
      businessDayMode.year = currentDate.getFullYear();
      updateDateFromBusinessDay();
    }

    function resetToDateInput() {
      // Reset to normal date input mode
      // No special action needed, just disable business day mode
    }

    function initBusinessDayModeMultiple() {
      // Initialize business day mode with current date values
      const currentDate = new Date(newRecord.Data || new Date());
      businessDayModeMultiple.month = currentDate.getMonth() + 1;
      businessDayModeMultiple.year = currentDate.getFullYear();
      updateDateFromBusinessDayMultiple();
    }

    function resetToDateInputMultiple() {
      // Reset to normal date input mode
      // No special action needed, just disable business day mode
    }

    function initBusinessDayModeEdit() {
      // Initialize business day mode with current editing record date values
      if (editingRecord.value) {
        const currentDate = new Date(editingRecord.value.Data || new Date());
        businessDayModeEdit.month = currentDate.getMonth() + 1;
        businessDayModeEdit.year = currentDate.getFullYear();
        updateDateFromBusinessDayEdit();
      }
    }

    function resetToDateInputEdit() {
      // Reset to normal date input mode
      // No special action needed, just disable business day mode
    }

    // Helper function to check if a record is recurring
    function isRecurringRecord(record: IFinanceRecord): boolean {
      return record.recurrence && record.recurrence.isActive || false;
    }

    return {
      data,
      filteredData,
      groupedByMonth,
      saldoFinal,
      editingItems,
      filter,
      categoryFilter,
      newRecord,
      editRecord,
      handleAdd,
      onDescriptionChange,
      onCategoryChange,
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
      setSorting,
      getSortIcon,
      getMonthTotal,
      getGlobalIndex,
      formatDate,
      recurrence,
      allAvailableMonths,
      showAllMonths,
      toggleMonthVisibility,
      getHiddenMonthsCount,
      hideMonth,
      getStateSnapshot,
      clearAllData,
      isDevelopment: import.meta.env?.DEV || window.location.hostname === 'localhost',
      editingRecord,
      openEditSheet,
      closeEditSheet,
      saveEditSheet,
      isMultipleMode,
      toggleMultipleMode: () => {
        isMultipleMode.value = !isMultipleMode.value;
        if (isMultipleMode.value) {
          newRecord.Data = getCurrentDate();
          newRecord.Descrição = '';
          newRecord.Valor = 0;
          newRecord.Tipo = 'Receita';
          newRecord.Categoria = '';
          newRecord.Status = '❌';
        }
      },
      multipleRecords,
      addMultipleRecord,
      saveAllMultipleRecords,
      clearMultipleRecords,
      removeMultipleRecord,
      editRecurrence,
      existingRecurrenceWarning,
      checkExistingRecurrence,
      confirmOverwriteRecurrence,
      cancelEditRecurrence,
      getEditRecurrenceOccurrences,
      getEditRecurrenceDescription,
      formatDateDisplay,
      parseDateInput,
      // Business day mode functionality
      businessDayMode,
      businessDayModeMultiple,
      businessDayModeEdit,
      updateDateFromBusinessDay,
      updateDateFromBusinessDayMultiple,
      updateDateFromBusinessDayEdit,
      getBusinessDayDescription,
      getRecordsWithoutCategory,
      refreshCategorization,
      debugCheckRecord,
      getMonthName,
      getYearOptions,
      initBusinessDayMode,
      resetToDateInput,
      initBusinessDayModeMultiple,
      resetToDateInputMultiple,
      isRecurringRecord
    };
  },
};
</script>

<style scoped>
button {
  cursor: pointer;
}

/* Animações do modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
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

/* Animações do sheet drawer */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet-content {
  animation: sheetSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-leave-active .sheet-content {
  animation: sheetSlideDown 0.3s ease-in;
}

@keyframes sheetSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes sheetSlideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }

  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

/* Animações específicas para desktop */
@media (min-width: 1024px) {
  .sheet-enter-active .sheet-content {
    animation: sheetFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .sheet-leave-active .sheet-content {
    animation: sheetFadeOut 0.3s ease-in;
  }

  @keyframes sheetFadeIn {
    from {
      transform: scale(0.9) translateY(20px);
      opacity: 0;
    }

    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  @keyframes sheetFadeOut {
    from {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    to {
      transform: scale(0.9) translateY(20px);
      opacity: 0;
    }
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