/**
 * Script principal para la Calculadora de Costos de Pastelería.
 * Maneja el cálculo de insumos, el ejemplo de torta, gastos fijos y la nueva calculadora de recetas.
 *
 * @version 1.1.0
 * @date 2025-04-30
 */

document.addEventListener("DOMContentLoaded", () => {
    /**
     * Establece el año actual en el footer.
     */
    const setCurrentYear = () => {
      const yearElement = document.getElementById("current-year");
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    };
  
    // --- Constantes y Configuraciones Globales ---
  
    /**
     * @typedef {'kg'|'g'|'lt'|'ml'|'unidades'} Unit
     * Define los tipos de unidades aceptados.
     */
  
    /**
     * Factores de conversión a una unidad base (gramos para peso, ml para volumen).
     * @type {Object.<Unit, number>}
     */
    const baseConversionFactors = {
      kg: 1000,  // 1 kg = 1000 g
      g: 1,      // Base para peso
      lt: 1000,  // 1 lt = 1000 ml
      ml: 1,      // Base para volumen
      unidades: 1 // Base para unidades
    };
  
    /**
     * Grupos de unidades compatibles entre sí.
     * @type {Object.<string, Unit[]>}
     */
    const unitGroups = {
      weight: ["kg", "g"],
      volume: ["lt", "ml"],
      units: ["unidades"]
    };
  
    // --- Funciones Utilitarias ---
  
    /**
     * Formatea un número como moneda (Peso Argentino).
     * @param {number} amount - La cantidad a formatear.
     * @returns {string} - La cantidad formateada como string (ej: $1,234.50).
     */
    const formatCurrency = (amount) => {
      if (isNaN(amount)) return "$0.00";
      return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
  
    /**
     * Parsea un valor de input a número flotante, devolviendo 0 si es inválido.
     * @param {string|number|null} value - El valor a parsear.
     * @returns {number} - El número parseado o 0.
     */
    const parseFloatInput = (value) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    };
  
     /**
     * Parsea un valor de input a número entero, devolviendo 1 si es inválido o menor a 1.
     * @param {string|number|null} value - El valor a parsear.
     * @param {number} [min=1] - El valor mínimo permitido.
     * @returns {number} - El número parseado o el mínimo.
     */
     const parseIntInput = (value, min = 1) => {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) || parsed < min ? min : parsed;
    };
  
    /**
     * Obtiene el grupo al que pertenece una unidad (weight, volume, units).
     * @param {Unit} unit - La unidad a verificar.
     * @returns {string|null} - El nombre del grupo o null si no se encuentra.
     */
    const getUnitGroup = (unit) => {
      for (const group in unitGroups) {
        if (unitGroups[group].includes(unit)) {
          return group;
        }
      }
      return null;
    };
  
    /**
     * Verifica si dos unidades son compatibles (pertenecen al mismo grupo).
     * @param {Unit} unit1 - La primera unidad.
     * @param {Unit} unit2 - La segunda unidad.
     * @returns {boolean} - True si son compatibles, false si no.
     */
    const areUnitsCompatible = (unit1, unit2) => {
      if (!unit1 || !unit2) return false;
      return getUnitGroup(unit1) === getUnitGroup(unit2);
    };
  
    /**
     * Obtiene las unidades compatibles para una unidad dada.
     * @param {Unit} unit - La unidad de referencia.
     * @returns {Unit[]} - Un array de unidades compatibles.
     */
    const getCompatibleUnits = (unit) => {
      const group = getUnitGroup(unit);
      return group ? unitGroups[group] : [];
    };
  
     /**
     * Muestra u oculta un mensaje de advertencia.
     * @param {HTMLElement} warningElement - El elemento HTML de la advertencia.
     * @param {string} [message] - El mensaje a mostrar. Si está vacío, oculta la advertencia.
     */
     const toggleWarning = (warningElement, message = "") => {
      if (!warningElement) return;
      warningElement.textContent = message;
      warningElement.classList.toggle("hidden", !message);
    };
  
    /**
     * Convierte una cantidad de una unidad a su unidad base (g o ml).
     * @param {number} quantity - La cantidad a convertir.
     * @param {Unit} unit - La unidad original.
     * @returns {number} - La cantidad convertida a la unidad base.
     */
    const convertToBaseUnit = (quantity, unit) => {
      return quantity * (baseConversionFactors[unit] || 1);
    };
  
    /**
     * Actualiza las opciones del select de unidad usada para que solo muestre unidades compatibles.
     * @param {HTMLSelectElement} purchasedUnitSelect - El select de unidad comprada.
     * @param {HTMLSelectElement} usedUnitSelect - El select de unidad usada a actualizar.
     * @param {Unit} [defaultUsedUnit] - La unidad que se preseleccionará si es compatible.
     */
    const updateCompatibleUsedUnits = (purchasedUnitSelect, usedUnitSelect, defaultUsedUnit) => {
      const purchasedUnit = purchasedUnitSelect.value;
      const compatibleUnits = getCompatibleUnits(purchasedUnit);
      const currentUsedUnit = usedUnitSelect.value;
  
      // Guardar la opción seleccionada actualmente si es compatible
      let selectedValue = null;
      if (compatibleUnits.includes(currentUsedUnit)) {
          selectedValue = currentUsedUnit;
      } else if (defaultUsedUnit && compatibleUnits.includes(defaultUsedUnit)) {
          selectedValue = defaultUsedUnit;
      } else if (compatibleUnits.length > 0) {
          // Si no hay selección válida, tomar la primera compatible
          selectedValue = compatibleUnits[0];
      }
  
      // Limpiar opciones actuales
      usedUnitSelect.innerHTML = "";
  
      // Agregar opciones compatibles
      compatibleUnits.forEach(unit => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        usedUnitSelect.appendChild(option);
      });
  
      // Restaurar la selección si es posible
      if (selectedValue) {
          usedUnitSelect.value = selectedValue;
      } else if (usedUnitSelect.options.length > 0) {
          // Si por alguna razón no hubo selección, seleccionar la primera opción disponible
          usedUnitSelect.value = usedUnitSelect.options[0].value;
      }
    };
  
  
    // --- Calculadora Rápida de Insumos ---
  
    const initIndividualCalculator = () => {
      const nameInput = document.getElementById("name");
      const totalPriceInput = document.getElementById("totalPrice");
      const purchasedQuantityInput = document.getElementById("purchasedQuantity");
      const purchasedUnitSelect = document.getElementById("purchasedUnit");
      const usedQuantityInput = document.getElementById("usedQuantity");
      const usedUnitSelect = document.getElementById("usedUnit");
      const resultDiv = document.getElementById("result");
      const resultText = document.getElementById("result-text");
      const copyBtn = document.getElementById("copy-btn");
      const shareBtn = document.getElementById("share-btn");
      const unitWarning = document.getElementById("unit-warning");
  
      if (!nameInput) return; // Salir si la calculadora no existe en la página
  
      /**
       * Calcula y muestra el costo de un insumo individual.
       */
      const calculateIndividualCost = () => {
        const name = nameInput.value.trim();
        const totalPrice = parseFloatInput(totalPriceInput.value);
        const purchasedQuantity = parseFloatInput(purchasedQuantityInput.value);
        const purchasedUnit = purchasedUnitSelect.value;
        const usedQuantity = parseFloatInput(usedQuantityInput.value);
        const usedUnit = usedUnitSelect.value;
  
        // Validar compatibilidad de unidades
        if (!areUnitsCompatible(purchasedUnit, usedUnit)) {
          toggleWarning(unitWarning, `Las unidades '${purchasedUnit}' y '${usedUnit}' no son compatibles.`);
          resultDiv.classList.add("hidden");
          return;
        } else {
          toggleWarning(unitWarning); // Ocultar advertencia si son compatibles
        }
  
        // Validar entradas numéricas
        if (!name || totalPrice <= 0 || purchasedQuantity <= 0 || usedQuantity < 0) {
          resultDiv.classList.add("hidden");
          return;
        }
         if (usedQuantity === 0) {
             resultText.textContent = `Usar 0 ${usedUnit} de ${name} cuesta ${formatCurrency(0)}`;
             resultDiv.classList.remove("hidden");
             return;
         }
  
  
        // Convertir cantidades a la unidad base
        const basePurchasedQuantity = convertToBaseUnit(purchasedQuantity, purchasedUnit);
        const baseUsedQuantity = convertToBaseUnit(usedQuantity, usedUnit);
  
        if (basePurchasedQuantity === 0) {
            resultDiv.classList.add("hidden");
            return; // Evitar división por cero
        }
  
        // Calcular costo por unidad base y costo final
        const costPerBaseUnit = totalPrice / basePurchasedQuantity;
        const finalCost = costPerBaseUnit * baseUsedQuantity;
  
        // Mostrar resultado
        resultText.textContent = `Usar ${usedQuantity} ${usedUnit} de "${name}" te cuesta ${formatCurrency(finalCost)}`;
        resultDiv.classList.remove("hidden");
      };
  
      // Event Listeners para la calculadora individual
      [nameInput, totalPriceInput, purchasedQuantityInput, usedQuantityInput, usedUnitSelect].forEach(el => {
        el.addEventListener("input", calculateIndividualCost);
      });
  
      purchasedUnitSelect.addEventListener("change", () => {
        updateCompatibleUsedUnits(purchasedUnitSelect, usedUnitSelect, purchasedUnitSelect.value === 'kg' ? 'g' : (purchasedUnitSelect.value === 'lt' ? 'ml' : null));
        calculateIndividualCost(); // Recalcular al cambiar unidad de compra
      });
  
      // Botón Copiar
      copyBtn?.addEventListener("click", () => {
        navigator.clipboard.writeText(resultText.textContent)
          .then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "¡Copiado!";
            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
          })
          .catch(err => console.error('Error al copiar: ', err));
      });
  
      // Botón Compartir (WhatsApp)
      shareBtn?.addEventListener("click", () => {
        const textToShare = resultText.textContent;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textToShare)}`;
        window.open(whatsappUrl, "_blank");
      });
  
      // Inicializar opciones de unidad usada y cálculo inicial
      updateCompatibleUsedUnits(purchasedUnitSelect, usedUnitSelect, 'g'); // Default g si es compatible
      calculateIndividualCost();
    };
  
  
    // --- Calculadora de Gastos Fijos ---
  
    const initFixedCostsCalculator = () => {
      const fixedCostInputs = [
          "rent", "services", "taxes", "salary", "marketing", "other-fixed"
      ];
      const monthlyFixedTotalSpan = document.getElementById("monthly-fixed-total");
      const monthlyProductsInput = document.getElementById("monthly-products");
      const fixedPerProductSpan = document.getElementById("fixed-per-product");
      const useCalculatedFixedCostBtn = document.getElementById("use-calculated-fixed-cost"); // Botón en calc recetas
      const recipeFixedCostInput = document.getElementById("recipe-fixed-cost-portion"); // Input en calc recetas
  
      if (!monthlyFixedTotalSpan) return; // Salir si la calculadora no existe
  
      let currentFixedCostPerProduct = 0; // Variable para almacenar el valor calculado
  
      /**
       * Calcula el total de gastos fijos mensuales y la porción por producto.
       */
      const calculateFixedCosts = () => {
        let totalMonthlyFixed = 0;
        fixedCostInputs.forEach(id => {
          const input = document.getElementById(id);
          if (input) {
            totalMonthlyFixed += parseFloatInput(input.value);
          }
        });
  
        monthlyFixedTotalSpan.textContent = formatCurrency(totalMonthlyFixed);
  
        const monthlyProducts = parseIntInput(monthlyProductsInput.value, 1); // Mínimo 1 producto
        currentFixedCostPerProduct = monthlyProducts > 0 ? totalMonthlyFixed / monthlyProducts : 0;
  
        fixedPerProductSpan.textContent = formatCurrency(currentFixedCostPerProduct);
      };
  
      // Event Listeners para gastos fijos
      fixedCostInputs.forEach(id => {
        const input = document.getElementById(id);
        input?.addEventListener("input", calculateFixedCosts);
      });
      monthlyProductsInput?.addEventListener("input", calculateFixedCosts);
  
      // Botón para usar el costo fijo calculado en la calculadora de recetas
      useCalculatedFixedCostBtn?.addEventListener("click", () => {
          if (recipeFixedCostInput) {
              recipeFixedCostInput.value = currentFixedCostPerProduct.toFixed(2);
              // Disparar evento input para que la calculadora de recetas se actualice si depende de este cambio
              recipeFixedCostInput.dispatchEvent(new Event('input'));
          }
      });
  
  
      // Cálculo inicial
      calculateFixedCosts();
    };
  
  
    // --- Ejemplo Práctico Torta (Interactivo) ---
  
    const initCakeExample = () => {
      const tabsContainer = document.querySelector(".cake-tabs");
      if (!tabsContainer) return; // Salir si el ejemplo no existe
  
      const tabBtns = tabsContainer.querySelectorAll(".tab-btn");
      const tabContents = tabsContainer.querySelectorAll(".tab-content");
      const nextTabBtns = tabsContainer.querySelectorAll(".next-tab-btn");
      const prevTabBtns = tabsContainer.querySelectorAll(".prev-tab-btn");
  
      // Pestañas
      const switchTab = (targetTabId) => {
        tabContents.forEach(content => content.classList.remove("active"));
        tabBtns.forEach(btn => btn.classList.remove("active"));
  
        document.getElementById(`${targetTabId}-tab`)?.classList.add("active");
        tabsContainer.querySelector(`.tab-btn[data-tab="${targetTabId}"]`)?.classList.add("active");
      };
  
      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
      });
      nextTabBtns.forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.next));
      });
      prevTabBtns.forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.prev));
      });
  
      // --- Lógica específica del ejemplo ---
  
      // Elementos DOM del ejemplo
      const ingredientsTbody = document.getElementById("ingredients-tbody-example");
      const ingredientsTotalSpan = document.getElementById("ingredients-total-example");
      const addIngredientBtn = document.getElementById("add-ingredient-btn-example");
      const exIngName = document.getElementById("ex-ing-name");
      const exIngTotalQty = document.getElementById("ex-ing-total-qty");
      const exIngTotalUnit = document.getElementById("ex-ing-total-unit");
      const exIngPrice = document.getElementById("ex-ing-price");
      const exIngUsedQty = document.getElementById("ex-ing-used-qty");
      const exIngUsedUnit = document.getElementById("ex-ing-used-unit");
      const exUnitWarning = document.getElementById("ex-unit-warning");
  
      const decorationTbody = document.getElementById("decoration-tbody-example");
      const decorationTotalSpan = document.getElementById("decoration-total-example");
      // ... (elementos para agregar decoración)
  
      const packagingTbody = document.getElementById("packaging-tbody-example");
      const packagingTotalSpan = document.getElementById("packaging-total-example");
      // ... (elementos para agregar packaging)
  
      const bakingInputs = [ // IDs de inputs de horneado
          "oven-power", "baking-time", "electricity-cost",
          "gas-cost-per-hour", "gas-baking-time",
          "equipment-cost", "equipment-lifespan"
      ];
      const bakingResultSpans = { // IDs de spans de resultados de horneado
          electricity: "electricity-result",
          gas: "gas-result",
          amortization: "amortization-result"
      };
      const bakingTotalSpan = document.getElementById("baking-total-example");
  
  
      const timeInputs = tabsContainer.querySelectorAll(".time-input-example"); // Inputs de tiempo
      const hourlyRateInput = document.getElementById("hourly-rate-example");
      const totalTimeSpan = document.getElementById("total-time-example");
      const timeValueSpan = document.getElementById("time-value-example");
  
      const finalIngredientsSpan = document.getElementById("final-ingredients-example");
      const finalBakingSpan = document.getElementById("final-baking-example");
      const finalDecorationSpan = document.getElementById("final-decoration-example");
      const finalPackagingSpan = document.getElementById("final-packaging-example");
      const finalTimeSpan = document.getElementById("final-time-example");
      const finalFixedCostSpan = document.getElementById("final-fixed-costs-example");
      const subtotalSpan = document.getElementById("subtotal-example");
      const totalCostSpan = document.getElementById("total-cost-example");
      const profitPercentageInput = document.getElementById("profit-percentage-example");
      const profitPercentageValueSpan = document.getElementById("profit-percentage-value-example");
      const profitAmountSpan = document.getElementById("profit-amount-example");
      const finalPriceSpan = document.getElementById("final-price-example");
      const portionsInput = document.getElementById("portions-example");
      const portionPriceSpan = document.getElementById("portion-price-example");
      const recalculateBtn = document.getElementById("recalculate-example-btn");
  
  
      /**
       * Calcula el costo de una fila de ingrediente o decoración.
       * @param {number} totalQty Cantidad total comprada.
       * @param {Unit} totalUnit Unidad total comprada.
       * @param {number} price Precio total de compra.
       * @param {number} usedQty Cantidad usada.
       * @param {Unit} usedUnit Unidad usada.
       * @returns {number} Costo calculado para la cantidad usada.
       */
      const calculateItemCost = (totalQty, totalUnit, price, usedQty, usedUnit) => {
        if (!areUnitsCompatible(totalUnit, usedUnit)) return 0;
        if (totalQty <= 0 || price <= 0 || usedQty < 0) return 0;
  
        const baseTotalQty = convertToBaseUnit(totalQty, totalUnit);
        const baseUsedQty = convertToBaseUnit(usedQty, usedUnit);
  
        if (baseTotalQty === 0) return 0;
  
        const costPerBase = price / baseTotalQty;
        return costPerBase * baseUsedQty;
      };
  
      /**
       * Actualiza el costo total de una tabla (ingredientes, decoración, packaging).
       * @param {HTMLTableSectionElement} tbody El tbody de la tabla.
       * @param {number} costColumnIndex El índice (0-based) de la columna de costo.
       * @param {HTMLElement} totalSpan El span donde mostrar el total.
       * @returns {number} El costo total calculado.
       */
      const updateTableTotal = (tbody, costColumnIndex, totalSpan) => {
        let total = 0;
        tbody.querySelectorAll("tr").forEach(row => {
          const costCell = row.cells[costColumnIndex];
          if (costCell) {
            total += parseFloatInput(costCell.textContent.replace(/[^0-9.-]+/g,"")); // Limpiar formato $
          }
        });
        totalSpan.textContent = formatCurrency(total);
        return total;
      };
  
      /** Elimina una fila de una tabla y recalcula el total. */
      const deleteTableRow = (buttonElement, tbody, costColumnIndex, totalSpan, updateTotalFn) => {
          const row = buttonElement.closest('tr');
          if (row) {
              row.remove();
              updateTotalFn(); // Llama a la función que recalcula todo
          }
      };
  
      /** Actualiza el costo total de ingredientes del ejemplo */
      const updateIngredientsTotalExample = () => {
          const total = updateTableTotal(ingredientsTbody, 4, ingredientsTotalSpan);
          if (finalIngredientsSpan) finalIngredientsSpan.textContent = formatCurrency(total);
          updateFinalCostExample(); // Recalcular todo
      };
       /** Actualiza el costo total de decoración del ejemplo */
      const updateDecorationTotalExample = () => {
          // Similar a ingredientes, ajustar índices si es necesario
          const total = updateTableTotal(decorationTbody, 4, decorationTotalSpan); // Asumiendo índice 4
          if (finalDecorationSpan) finalDecorationSpan.textContent = formatCurrency(total);
           updateFinalCostExample(); // Recalcular todo
      };
       /** Actualiza el costo total de packaging del ejemplo */
      const updatePackagingTotalExample = () => {
          const total = updateTableTotal(packagingTbody, 3, packagingTotalSpan); // Asumiendo índice 3
          if (finalPackagingSpan) finalPackagingSpan.textContent = formatCurrency(total);
           updateFinalCostExample(); // Recalcular todo
      };
  
       /** Agrega un ingrediente a la tabla del ejemplo */
      const addIngredientExample = () => {
          const name = exIngName.value.trim();
          const totalQty = parseFloatInput(exIngTotalQty.value);
          const totalUnit = exIngTotalUnit.value;
          const price = parseFloatInput(exIngPrice.value);
          const usedQty = parseFloatInput(exIngUsedQty.value);
          const usedUnit = exIngUsedUnit.value;
  
          if (!name || totalQty <= 0 || price <= 0 || usedQty < 0) {
              alert("Por favor, completá todos los campos del ingrediente correctamente.");
              return;
          }
          if (!areUnitsCompatible(totalUnit, usedUnit)) {
              toggleWarning(exUnitWarning, `Unidades '${totalUnit}' y '${usedUnit}' no compatibles.`);
              return;
          } else {
              toggleWarning(exUnitWarning);
          }
  
          const cost = calculateItemCost(totalQty, totalUnit, price, usedQty, usedUnit);
  
          const newRow = ingredientsTbody.insertRow();
          newRow.innerHTML = `
              <td>${name}</td>
              <td>${totalQty} ${totalUnit}</td>
              <td>${formatCurrency(price)}</td>
              <td>${usedQty} ${usedUnit}</td>
              <td>${formatCurrency(cost)}</td>
              <td><button class="btn-delete-row">X</button></td>
          `;
  
          // Limpiar formulario
          exIngName.value = "";
          exIngTotalQty.value = "";
          exIngPrice.value = "";
          exIngUsedQty.value = "";
          // No limpiar unidades para facilitar ingresos repetidos
          newRow.querySelector('.btn-delete-row').addEventListener('click', (e) => deleteTableRow(e.target, ingredientsTbody, 4, ingredientsTotalSpan, updateIngredientsTotalExample));
  
  
          updateIngredientsTotalExample();
      };
  
      // --- (Aquí irían funciones similares para addDecorationExample y addPackagingExample) ---
  
  
      /** Calcula los costos de horneado/servicios del ejemplo */
      const calculateBakingCostsExample = () => {
          const power = parseFloatInput(document.getElementById("oven-power")?.value);
          const time = parseFloatInput(document.getElementById("baking-time")?.value);
          const costKwh = parseFloatInput(document.getElementById("electricity-cost")?.value);
          const gasCostHour = parseFloatInput(document.getElementById("gas-cost-per-hour")?.value);
          const gasTime = parseFloatInput(document.getElementById("gas-baking-time")?.value);
          const equipCost = parseFloatInput(document.getElementById("equipment-cost")?.value);
          const equipLifespan = parseIntInput(document.getElementById("equipment-lifespan")?.value, 1);
  
          const electricityCost = (power / 1000) * (time / 60) * costKwh;
          const gasCost = (gasCostHour / 60) * gasTime;
          const amortizationCost = equipLifespan > 0 ? equipCost / equipLifespan : 0;
  
          document.getElementById(bakingResultSpans.electricity).textContent = formatCurrency(electricityCost);
          document.getElementById(bakingResultSpans.gas).textContent = formatCurrency(gasCost);
          document.getElementById(bakingResultSpans.amortization).textContent = formatCurrency(amortizationCost);
  
          const totalBaking = electricityCost + gasCost + amortizationCost;
          bakingTotalSpan.textContent = formatCurrency(totalBaking);
          if (finalBakingSpan) finalBakingSpan.textContent = formatCurrency(totalBaking);
          updateFinalCostExample(); // Recalcular todo
      };
  
      /** Calcula el costo de mano de obra del ejemplo */
      const calculateTimeCostExample = () => {
          let totalMinutes = 0;
          timeInputs.forEach(input => {
              totalMinutes += parseIntInput(input.value, 0); // Permitir 0 minutos
          });
  
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          totalTimeSpan.textContent = `${hours} hs ${minutes} min`;
  
          const hourlyRate = parseFloatInput(hourlyRateInput.value);
          const timeCost = (totalMinutes / 60) * hourlyRate;
          timeValueSpan.textContent = formatCurrency(timeCost);
          if (finalTimeSpan) finalTimeSpan.textContent = formatCurrency(timeCost);
          updateFinalCostExample(); // Recalcular todo
      };
  
       /** Actualiza el costo final y precio del ejemplo */
       const updateFinalCostExample = () => {
          // Obtener costos parciales (ya formateados por sus funciones)
          const ingredients = parseFloatInput(finalIngredientsSpan?.textContent.replace(/[^0-9.-]+/g,""));
          const baking = parseFloatInput(finalBakingSpan?.textContent.replace(/[^0-9.-]+/g,""));
          const decoration = parseFloatInput(finalDecorationSpan?.textContent.replace(/[^0-9.-]+/g,""));
          const packaging = parseFloatInput(finalPackagingSpan?.textContent.replace(/[^0-9.-]+/g,""));
          const time = parseFloatInput(finalTimeSpan?.textContent.replace(/[^0-9.-]+/g,""));
  
          // Obtener costo fijo calculado (si existe)
          const fixedCostPerProdSpan = document.getElementById("fixed-per-product");
          let fixedCostPortion = 0;
          if (fixedCostPerProdSpan) {
               fixedCostPortion = parseFloatInput(fixedCostPerProdSpan.textContent.replace(/[^0-9.-]+/g,""));
               if (finalFixedCostSpan) finalFixedCostSpan.textContent = formatCurrency(fixedCostPortion);
          }
  
  
          const sub = ingredients + baking + decoration + packaging + time;
          const totalCost = sub + fixedCostPortion;
  
          if (subtotalSpan) subtotalSpan.textContent = formatCurrency(sub);
          if (totalCostSpan) totalCostSpan.textContent = formatCurrency(totalCost);
  
          // Calcular Ganancia y Precio Final
          const profitPercentage = parseFloatInput(profitPercentageInput?.value);
          profitPercentageValueSpan.textContent = `${profitPercentage}%`;
  
          const profitAmount = totalCost * (profitPercentage / 100);
          const finalPrice = totalCost + profitAmount;
          const portions = parseIntInput(portionsInput?.value, 1);
          const portionPrice = portions > 0 ? finalPrice / portions : 0;
  
          profitAmountSpan.textContent = formatCurrency(profitAmount);
          finalPriceSpan.textContent = formatCurrency(finalPrice);
          portionPriceSpan.textContent = formatCurrency(portionPrice);
       };
  
  
      // --- Event Listeners del Ejemplo ---
      addIngredientBtn?.addEventListener("click", addIngredientExample);
  
      // Listener para borrar filas (delegación de eventos)
      ingredientsTbody?.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-delete-row')) {
              deleteTableRow(e.target, ingredientsTbody, 4, ingredientsTotalSpan, updateIngredientsTotalExample);
          }
      });
       decorationTbody?.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-delete-row')) {
              // Ajustar índices según la tabla de decoración
              deleteTableRow(e.target, decorationTbody, 4, decorationTotalSpan, updateDecorationTotalExample);
          }
      });
        packagingTbody?.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-delete-row')) {
               // Ajustar índices según la tabla de packaging
              deleteTableRow(e.target, packagingTbody, 3, packagingTotalSpan, updatePackagingTotalExample);
          }
      });
  
  
      // Listeners para cálculo de horneado
      bakingInputs.forEach(id => {
          document.getElementById(id)?.addEventListener("input", calculateBakingCostsExample);
      });
  
      // Listeners para cálculo de tiempo
      timeInputs.forEach(input => {
          input.addEventListener("input", calculateTimeCostExample);
      });
      hourlyRateInput?.addEventListener("input", calculateTimeCostExample);
  
      // Listeners para cálculo de precio final
      profitPercentageInput?.addEventListener("input", updateFinalCostExample);
      portionsInput?.addEventListener("input", updateFinalCostExample);
  
       // Listener para actualizar unidades compatibles en el form de ejemplo
      exIngTotalUnit?.addEventListener("change", () => {
          updateCompatibleUsedUnits(exIngTotalUnit, exIngUsedUnit);
          toggleWarning(exUnitWarning); // Limpiar advertencia al cambiar unidad de compra
      });
       exIngUsedUnit?.addEventListener("change", () => { // Validar al cambiar unidad usada
         if (!areUnitsCompatible(exIngTotalUnit.value, exIngUsedUnit.value)) {
              toggleWarning(exUnitWarning, `Unidades '${exIngTotalUnit.value}' y '${exIngUsedUnit.value}' no compatibles.`);
         } else {
             toggleWarning(exUnitWarning);
         }
      });
      // ...(listeners similares para unidades de decoración si se implementa el add)...
  
      recalculateBtn?.addEventListener("click", () => {
          // Llama a todas las funciones de recálculo
          updateIngredientsTotalExample();
          updateDecorationTotalExample();
          updatePackagingTotalExample();
          calculateBakingCostsExample();
          calculateTimeCostExample();
          // updateFinalCostExample() ya es llamado por las anteriores
      });
  
  
      // --- Inicialización del Ejemplo ---
      updateCompatibleUsedUnits(exIngTotalUnit, exIngUsedUnit, 'g'); // Inicializar unidades form ejemplo
      // ...(inicializar unidades form decoración)...
      updateIngredientsTotalExample();
      updateDecorationTotalExample();
      updatePackagingTotalExample();
      calculateBakingCostsExample();
      calculateTimeCostExample();
      // updateFinalCostExample() es llamado por las anteriores
    };
  
  
    // --- Calculadora de Recetas Propias ---
  
    const initRecipeCreator = () => {
      const creatorContainer = document.getElementById("recipe-creator");
      if (!creatorContainer) return;
  
      // Elementos DOM Calculadora Recetas
      const recipeNameInput = document.getElementById("recipe-name");
      const ingredientsTbody = document.getElementById("recipe-ingredients-tbody");
      const ingredientsTotalSpan = document.getElementById("recipe-ingredients-total");
      const addIngredientBtn = document.getElementById("add-recipe-ingredient-btn");
      // Inputs del formulario de agregar ingrediente
      const recipeIngName = document.getElementById("recipe-ing-name");
      const recipeIngTotalQty = document.getElementById("recipe-ing-total-qty");
      const recipeIngTotalUnit = document.getElementById("recipe-ing-total-unit");
      const recipeIngPrice = document.getElementById("recipe-ing-price");
      const recipeIngUsedQty = document.getElementById("recipe-ing-used-qty");
      const recipeIngUsedUnit = document.getElementById("recipe-ing-used-unit");
      const recipeIngUnitWarning = document.getElementById("recipe-ing-unit-warning");
      // Otros costos
      const recipeBakingCostInput = document.getElementById("recipe-baking-cost");
      const recipePackagingCostInput = document.getElementById("recipe-packaging-cost");
      // Mano de obra
      const recipeTimeInput = document.getElementById("recipe-time");
      const recipeHourlyRateInput = document.getElementById("recipe-hourly-rate");
      const recipeLaborCostSpan = document.getElementById("recipe-labor-cost"); // El span intermedio
      // Costos indirectos y ganancia
      const recipeFixedCostInput = document.getElementById("recipe-fixed-cost-portion");
      const recipeProfitInput = document.getElementById("recipe-profit");
      const recipePortionsInput = document.getElementById("recipe-portions");
      // Resultados finales
      const recipeMaterialCostResultSpan = document.getElementById("recipe-material-cost-result");
      const recipeLaborCostResultSpan = document.getElementById("recipe-labor-cost-result");
      const recipeFixedCostResultSpan = document.getElementById("recipe-fixed-cost-result");
      const recipeTotalCostResultSpan = document.getElementById("recipe-total-cost-result");
      const recipeProfitResultSpan = document.getElementById("recipe-profit-result");
      const recipeFinalPriceResultSpan = document.getElementById("recipe-final-price-result");
      const recipePortionPriceResultSpan = document.getElementById("recipe-portion-price-result");
      // Botones
      const calculateRecipeBtn = document.getElementById("calculate-recipe-btn");
      const exportPdfBtn = document.getElementById("export-pdf-btn");
  
  
      /** Actualiza el costo total de ingredientes de la receta propia */
      const updateRecipeIngredientsTotal = () => {
        const total = updateTableTotal(ingredientsTbody, 4, ingredientsTotalSpan); // Índice 4 para costo
        // No hay un span final directo, el cálculo se hace en la función principal
        return total;
      };
  
      /** Agrega un ingrediente a la tabla de la receta propia */
      const addRecipeIngredient = () => {
        const name = recipeIngName.value.trim();
        const totalQty = parseFloatInput(recipeIngTotalQty.value);
        const totalUnit = recipeIngTotalUnit.value;
        const price = parseFloatInput(recipeIngPrice.value);
        const usedQty = parseFloatInput(recipeIngUsedQty.value);
        const usedUnit = recipeIngUsedUnit.value;
  
        if (!name || totalQty <= 0 || price <= 0 || usedQty < 0) {
          alert("Completá los datos del ingrediente correctamente.");
          return;
        }
        if (!areUnitsCompatible(totalUnit, usedUnit)) {
            toggleWarning(recipeIngUnitWarning, `Unidades '${totalUnit}' y '${usedUnit}' no compatibles.`);
            return;
        } else {
            toggleWarning(recipeIngUnitWarning);
        }
  
        const cost = calculateItemCost(totalQty, totalUnit, price, usedQty, usedUnit);
  
        const newRow = ingredientsTbody.insertRow();
        newRow.innerHTML = `
            <td>${name}</td>
            <td>${totalQty} ${totalUnit}</td>
            <td>${formatCurrency(price)}</td>
            <td>${usedQty} ${usedUnit}</td>
            <td>${formatCurrency(cost)}</td>
            <td><button class="btn-delete-row">X</button></td>
        `;
        // Limpiar formulario
        recipeIngName.value = "";
        recipeIngTotalQty.value = "";
        recipeIngPrice.value = "";
        recipeIngUsedQty.value = "";
  
        newRow.querySelector('.btn-delete-row').addEventListener('click', (e) => {
             const row = e.target.closest('tr');
              if (row) {
                  row.remove();
                  // Actualizar total ingredientes inmediatamente al borrar
                  updateRecipeIngredientsTotal();
                   // Podríamos recalcular todo aquí o esperar al botón "Calcular Mi Receta"
                   // calculateMyRecipe();
              }
        });
  
        updateRecipeIngredientsTotal(); // Actualizar span del total de ingredientes
         // Podríamos recalcular todo aquí o esperar al botón "Calcular Mi Receta"
         // calculateMyRecipe();
      };
  
  
       /** Calcula y muestra todos los costos y el precio final de la receta propia */
       const calculateMyRecipe = () => {
          // 1. Costo Ingredientes
          const ingredientsCost = updateRecipeIngredientsTotal(); // Ya calcula y actualiza el span
  
          // 2. Otros Costos Directos
          const bakingCost = parseFloatInput(recipeBakingCostInput.value);
          const packagingCost = parseFloatInput(recipePackagingCostInput.value);
          const materialCost = ingredientsCost + bakingCost + packagingCost;
          if (recipeMaterialCostResultSpan) recipeMaterialCostResultSpan.textContent = formatCurrency(materialCost);
  
          // 3. Mano de Obra
          const timeMinutes = parseIntInput(recipeTimeInput.value, 0);
          const hourlyRate = parseFloatInput(recipeHourlyRateInput.value);
          const laborCost = (timeMinutes / 60) * hourlyRate;
          if (recipeLaborCostSpan) recipeLaborCostSpan.textContent = formatCurrency(laborCost); // Span intermedio
          if (recipeLaborCostResultSpan) recipeLaborCostResultSpan.textContent = formatCurrency(laborCost); // Span en resultados
  
          // 4. Costos Indirectos (Gastos Fijos)
          const fixedCostPortion = parseFloatInput(recipeFixedCostInput.value);
          if (recipeFixedCostResultSpan) recipeFixedCostResultSpan.textContent = formatCurrency(fixedCostPortion);
  
          // 5. Costo Total
          const totalCost = materialCost + laborCost + fixedCostPortion;
          if (recipeTotalCostResultSpan) recipeTotalCostResultSpan.textContent = formatCurrency(totalCost);
  
          // 6. Ganancia y Precio Final
          const profitPercentage = parseFloatInput(recipeProfitInput.value);
          const profitAmount = totalCost * (profitPercentage / 100);
          const finalPrice = totalCost + profitAmount;
          const portions = parseIntInput(recipePortionsInput.value, 1);
          const portionPrice = portions > 0 ? finalPrice / portions : 0;
  
          if (recipeProfitResultSpan) recipeProfitResultSpan.textContent = formatCurrency(profitAmount);
          if (recipeFinalPriceResultSpan) recipeFinalPriceResultSpan.textContent = formatCurrency(finalPrice);
          if (recipePortionPriceResultSpan) recipePortionPriceResultSpan.textContent = formatCurrency(portionPrice);
  
       };
  
       /**
        * Prepara los datos de la receta para exportar (a consola por ahora).
        * La exportación real a PDF requeriría una librería como jsPDF o pdf-lib.
        */
       const exportRecipeData = () => {
          console.warn("La exportación a PDF no está implementada. Requiere librería externa.");
          alert("La función de exportar a PDF aún no está disponible.");
  
          // Recopilar datos (ejemplo básico)
          const recipeData = {
              name: recipeNameInput.value || "Mi Receta",
              ingredients: [],
              costs: {
                  ingredients: recipeMaterialCostResultSpan.textContent,
                  labor: recipeLaborCostResultSpan.textContent,
                  fixed: recipeFixedCostResultSpan.textContent,
                  total: recipeTotalCostResultSpan.textContent,
              },
              pricing: {
                  profit: recipeProfitResultSpan.textContent,
                  finalPrice: recipeFinalPriceResultSpan.textContent,
                  portions: recipePortionsInput.value,
                  portionPrice: recipePortionPriceResultSpan.textContent,
              }
          };
  
          ingredientsTbody.querySelectorAll("tr").forEach(row => {
              recipeData.ingredients.push({
                  name: row.cells[0].textContent,
                  purchased: row.cells[1].textContent,
                  price: row.cells[2].textContent,
                  used: row.cells[3].textContent,
                  cost: row.cells[4].textContent,
              });
          });
  
          console.log("--- Datos de la Receta para Exportar ---");
          console.log(JSON.stringify(recipeData, null, 2)); // Mostrar en consola
  
          // --- Aquí iría la lógica con jsPDF ---
          // Ejemplo conceptual (NO FUNCIONAL SIN LIBRERÍA):
          // const { jsPDF } = window.jspdf; // Asumiendo que jsPDF está cargado globalmente
          // if (typeof jsPDF === 'undefined') {
          //     console.error("jsPDF no está cargado.");
          //     return;
          // }
          // const doc = new jsPDF();
          // doc.text(`Receta: ${recipeData.name}`, 10, 10);
          // // ... agregar más contenido al PDF ...
          // doc.save(`${recipeData.name}.pdf`);
          // --- Fin del ejemplo conceptual ---
       };
  
  
      // --- Event Listeners Calculadora Recetas ---
      addIngredientBtn?.addEventListener("click", addRecipeIngredient);
  
       // Listener para borrar filas (delegación)
       ingredientsTbody?.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-delete-row')) {
              const row = e.target.closest('tr');
              if (row) {
                  row.remove();
                  updateRecipeIngredientsTotal(); // Actualizar total ingredientes al borrar
                  // Opcional: recalcular todo llamando a calculateMyRecipe();
              }
          }
      });
  
  
      // Recalcular mano de obra intermedia al cambiar tiempo o valor hora
      recipeTimeInput?.addEventListener('input', () => {
          const timeMinutes = parseIntInput(recipeTimeInput.value, 0);
          const hourlyRate = parseFloatInput(recipeHourlyRateInput.value);
          const laborCost = (timeMinutes / 60) * hourlyRate;
          if(recipeLaborCostSpan) recipeLaborCostSpan.textContent = formatCurrency(laborCost);
      });
      recipeHourlyRateInput?.addEventListener('input', () => {
           const timeMinutes = parseIntInput(recipeTimeInput.value, 0);
           const hourlyRate = parseFloatInput(recipeHourlyRateInput.value);
           const laborCost = (timeMinutes / 60) * hourlyRate;
           if(recipeLaborCostSpan) recipeLaborCostSpan.textContent = formatCurrency(laborCost);
      });
  
      // Botón principal para calcular toda la receta
      calculateRecipeBtn?.addEventListener("click", calculateMyRecipe);
  
      // Botón Exportar PDF (deshabilitado por defecto)
      exportPdfBtn?.addEventListener("click", exportRecipeData);
  
      // Listener para actualizar unidades compatibles en el form de receta propia
      recipeIngTotalUnit?.addEventListener("change", () => {
          updateCompatibleUsedUnits(recipeIngTotalUnit, recipeIngUsedUnit);
           toggleWarning(recipeIngUnitWarning); // Limpiar al cambiar unidad compra
      });
       recipeIngUsedUnit?.addEventListener("change", () => { // Validar al cambiar unidad usada
         if (!areUnitsCompatible(recipeIngTotalUnit.value, recipeIngUsedUnit.value)) {
              toggleWarning(recipeIngUnitWarning, `Unidades '${recipeIngTotalUnit.value}' y '${recipeIngUsedUnit.value}' no compatibles.`);
         } else {
             toggleWarning(recipeIngUnitWarning);
         }
      });
  
  
      // Inicialización
      updateCompatibleUsedUnits(recipeIngTotalUnit, recipeIngUsedUnit, 'g'); // Default g
      // Calcular mano de obra inicial si hay valores por defecto
       const initialTime = parseIntInput(recipeTimeInput?.value, 0);
       const initialRate = parseFloatInput(recipeHourlyRateInput?.value);
       if (recipeLaborCostSpan) recipeLaborCostSpan.textContent = formatCurrency((initialTime / 60) * initialRate);
       // Podríamos llamar a calculateMyRecipe() al inicio si queremos resultados iniciales
       // calculateMyRecipe();
    };
  
  
    // --- Inicialización General ---
    setCurrentYear();
    initIndividualCalculator();
    initFixedCostsCalculator();
    initCakeExample();
    initRecipeCreator();
  
  }); // Fin del DOMContentLoaded