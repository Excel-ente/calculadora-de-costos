/**
 * Script para la Guía Interactiva de Costos con validación y exportación PDF.
 * Versión autónoma (incluye funciones de utilidad necesarias).
 * DEPENDENCIAS (en HTML):
 * - jsPDF library (https://github.com/parallax/jsPDF)
 * - jsPDF-AutoTable plugin (https://github.com/simonbengtsson/jsPDF-AutoTable)
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- Verificación de Dependencias (Opcional pero recomendado) ---
    let jsPDF_is_loaded = false;
    let jsPDF_AutoTable_is_loaded = false;

    if (typeof jspdf !== 'undefined' && typeof jspdf.jsPDF !== 'undefined') {
        jsPDF_is_loaded = true;
        try {
            const jsPdfInstance = new jspdf.jsPDF(); // Crear instancia temporal para verificar AutoTable
            if (typeof jsPdfInstance.autoTable === 'function') {
                jsPDF_AutoTable_is_loaded = true;
            } else {
                console.warn("Plugin jsPDF-AutoTable no cargado. Tablas en PDF tendrán formato básico.");
            }
        } catch(e) {
            console.error("Error al instanciar jsPDF para verificar AutoTable:", e);
            jsPDF_is_loaded = false; // Considerar no cargado si falla la instancia
        }
    } else {
        console.error("Librería jsPDF no está cargada. Exportación a PDF no funcionará.");
    }


    // =============================================================
    // == FUNCIONES UTILITARIAS INTEGRADAS (de script.js) ==
    // =============================================================

    /**
     * @typedef {'kg'|'g'|'lt'|'ml'|'unidades'} Unit
     */

    const baseConversionFactors = {
      kg: 1000, g: 1, lt: 1000, ml: 1, unidades: 1
    };

    const unitGroups = {
      weight: ["kg", "g"],
      volume: ["lt", "ml"],
      units: ["unidades"]
    };

    const formatCurrency = (amount) => {
      if (isNaN(amount) || amount === null) return "$0.00";
      return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseFloatInput = (value) => {
      const parsed = parseFloat(String(value).replace(',', '.')); // Reemplazar coma por punto
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    };

     const parseIntInput = (value, min = 1) => {
      const parsed = parseInt(value, 10);
      const minimum = min === 0 ? 0 : (isNaN(min) ? 1 : min); // Permitir min 0 explicitamente
      return isNaN(parsed) || parsed < minimum ? minimum : parsed;
    };

    const getUnitGroup = (unit) => {
      for (const group in unitGroups) {
        if (unitGroups[group].includes(unit)) {
          return group;
        }
      }
      return null;
    };

    const areUnitsCompatible = (unit1, unit2) => {
        if (!unit1 || !unit2) return false;
        const group1 = getUnitGroup(unit1);
        const group2 = getUnitGroup(unit2);
        // Considerar 'unidades' compatible solo consigo mismo
        if (group1 === 'units' || group2 === 'units') {
            return group1 === group2;
        }
        // Permitir cualquier combinación si no son 'unidades' (simplificación - ajustar si es necesario)
        // return group1 === group2 && group1 !== null; // Original más estricto
         return group1 === group2; // Permite kg/g y lt/ml
    };


    const getCompatibleUnits = (unit) => {
      const group = getUnitGroup(unit);
      return group ? unitGroups[group] : [unit]; // Devuelve la misma unidad si no hay grupo
    };

    const toggleWarning = (warningElement, message = "") => {
      if (!warningElement) return;
      warningElement.textContent = message;
      warningElement.classList.toggle("hidden", !message);
    };

    const convertToBaseUnit = (quantity, unit) => {
        const factor = baseConversionFactors[unit];
        if (factor === undefined) {
             console.warn(`Factor de conversión no encontrado para la unidad: ${unit}`);
             return quantity; // Devolver cantidad original si no hay factor
        }
      return quantity * factor;
    };

    const updateCompatibleUsedUnits = (purchasedUnitSelect, usedUnitSelect, defaultUsedUnit = null) => {
        if (!purchasedUnitSelect || !usedUnitSelect) return;

        const purchasedUnit = purchasedUnitSelect.value;
        const compatibleUnits = getCompatibleUnits(purchasedUnit);
        const currentUsedUnit = usedUnitSelect.value;

        let selectedValue = null;
        if (compatibleUnits.includes(currentUsedUnit)) {
            selectedValue = currentUsedUnit;
        } else if (defaultUsedUnit && compatibleUnits.includes(defaultUsedUnit)) {
            selectedValue = defaultUsedUnit;
        } else if (compatibleUnits.length > 0) {
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
            usedUnitSelect.value = usedUnitSelect.options[0].value;
        }
    };


     const calculateItemCost = (totalQty, totalUnit, price, usedQty, usedUnit) => {
        // Añadir validación robusta aquí también
        if (!areUnitsCompatible(totalUnit, usedUnit)) {
             console.error(`Intento de cálculo con unidades incompatibles: ${totalUnit} y ${usedUnit}`);
             return 0; // O NaN para indicar error
        }
        if (totalQty <= 0 || price <= 0 || usedQty < 0) {
            console.error("Valores inválidos para cálculo de costo:", { totalQty, price, usedQty });
            return 0; // O NaN
        }

        const baseTotalQty = convertToBaseUnit(totalQty, totalUnit);
        const baseUsedQty = convertToBaseUnit(usedQty, usedUnit);

        if (baseTotalQty === 0) {
             console.error("Cantidad base total es cero, división por cero evitada.");
             return 0; // O NaN
        }

        const costPerBase = price / baseTotalQty;
        const finalCost = costPerBase * baseUsedQty;

        // Controlar que el resultado sea un número
        return isNaN(finalCost) ? 0 : finalCost;
      };


    // --- Selectores del DOM (Guía Interactiva) ---
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-step-btn');
    const prevButtons = document.querySelectorAll('.prev-step-btn');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const calculateFinalBtn = document.getElementById('calculate-final-guide-btn');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const finalResultsDiv = document.getElementById('guide-final-results');
    const pdfLoader = document.getElementById('pdf-loader');
    const pdfError = document.getElementById('error-pdf');
    const postPdfModal = document.getElementById('post-pdf-modal');

    // Inputs y Elementos de Datos
    const recipeNameInput = document.getElementById('guide-recipe-name');
    const ingNameInput = document.getElementById('guide-ing-name');
    const ingPriceInput = document.getElementById('guide-ing-price');
    const ingTotalQtyInput = document.getElementById('guide-ing-total-qty');
    const ingTotalUnitSelect = document.getElementById('guide-ing-total-unit');
    const ingUsedQtyInput = document.getElementById('guide-ing-used-qty');
    const ingUsedUnitSelect = document.getElementById('guide-ing-used-unit');
    const ingUnitWarning = document.getElementById('guide-unit-warning');
    const addIngredientBtn = document.getElementById('add-ingredient-guide-btn');
    const ingredientsListUl = document.getElementById('guide-ingredients-list');
    const ingredientsTotalSpan = document.getElementById('guide-ingredients-total');
    const emptyListMsg = ingredientsListUl?.querySelector('.list-empty');
    const packagingCostInput = document.getElementById('guide-packaging-cost');
    const bakingCostInput = document.getElementById('guide-baking-cost');
    const timeInput = document.getElementById('guide-time');
    const hourlyRateInput = document.getElementById('guide-hourly-rate');
    const laborCostDisplay = document.getElementById('guide-labor-cost-display');
    const fixedCostInput = document.getElementById('guide-fixed-cost');
    const profitInput = document.getElementById('guide-profit');
    const portionsInput = document.getElementById('guide-portions');
    const resRecipeName = document.getElementById('res-recipe-name');
    const resMaterial = document.getElementById('res-material');
    const resLabor = document.getElementById('res-labor');
    const resFixed = document.getElementById('res-fixed');
    const resTotalCost = document.getElementById('res-total-cost');
    const resProfitPerc = document.getElementById('res-profit-perc');
    const resProfit = document.getElementById('res-profit');
    const resPortions = document.getElementById('res-portions');
    const resFinalPrice = document.getElementById('res-final-price');
    const resPortionPrice = document.getElementById('res-portion-price');

    // --- Estado de la Guía ---
    let currentStep = 1;
    const totalSteps = steps.length;
    let recipeData = {
        name: '',
        ingredients: [],
        packagingCost: 0,
        bakingCost: 0,
        time: 0,
        hourlyRate: 0,
        laborCost: 0,
        fixedCost: 0,
        profitPercentage: 40,
        portions: 12,
        totalIngredientCost: 0,
        totalMaterialCost: 0,
        totalCost: 0,
        profitAmount: 0,
        finalPrice: 0,
        portionPrice: 0
    };

    // --- Funciones de Validación y UI (Específicas de la Guía) ---

    const showError = (fieldId, message) => {
        const errorDiv = document.getElementById(`error-${fieldId}`);
        const inputElement = document.getElementById(`guide-${fieldId}`); // Asume prefijo 'guide-'
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
        // Intenta encontrar el input sin el prefijo si no lo encontró con él
        const inputElementGeneric = inputElement || document.getElementById(fieldId);
        if (inputElementGeneric) {
            inputElementGeneric.classList.add('invalid');
        }
    };

    const clearError = (fieldId) => {
        const errorDiv = document.getElementById(`error-${fieldId}`);
        const inputElement = document.getElementById(`guide-${fieldId}`);
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
        const inputElementGeneric = inputElement || document.getElementById(fieldId);
        if (inputElementGeneric) {
            inputElementGeneric.classList.remove('invalid');
        }
    };

    const clearStepErrors = (stepElement) => {
        stepElement?.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
        stepElement?.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        stepElement?.querySelectorAll('.unit-warning').forEach(el => el.classList.add('hidden'));
    };

    const validateStep = (stepNumber) => {
        let isValid = true;
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (!currentStepElement) return true; // Si el paso no existe, no validar

        clearStepErrors(currentStepElement);

        switch (stepNumber) {
            case 1:
                if (!recipeNameInput?.value.trim()) {
                    showError('recipe-name', 'Por favor, ingresá un nombre para tu receta.'); isValid = false;
                }
                break;
            case 2:
                if (recipeData.ingredients.length === 0) {
                     const listError = document.getElementById('error-ingredients-list');
                     if(listError) listError.classList.remove('hidden');
                    isValid = false;
                } else {
                    const listError = document.getElementById('error-ingredients-list');
                    if(listError) listError.classList.add('hidden');
                }
                break;
            case 3:
                if (packagingCostInput && packagingCostInput.value && isNaN(parseFloatInput(packagingCostInput.value))) {
                    showError('packaging-cost', 'Ingresá un número válido.'); isValid = false;
                }
                if (bakingCostInput && bakingCostInput.value && isNaN(parseFloatInput(bakingCostInput.value))) {
                   showError('baking-cost', 'Ingresá un número válido.'); isValid = false;
                }
                break;
            case 4:
                if (!timeInput || !timeInput.value || parseIntInput(timeInput.value, 0) < 0) {
                   showError('time', 'Ingresá un tiempo válido (número entero >= 0).'); isValid = false;
                }
                 if (!hourlyRateInput || !hourlyRateInput.value || parseFloatInput(hourlyRateInput.value) < 0) { // Permitir 0 ahora? O >0?
                   showError('hourly-rate', 'Ingresá un valor por hora válido (>= 0).'); isValid = false;
                }
                break;
            case 5:
                 if (fixedCostInput && fixedCostInput.value && isNaN(parseFloatInput(fixedCostInput.value))) {
                   showError('fixed-cost', 'Ingresá un número válido.'); isValid = false;
                }
                break;
            case 6: // Validar ANTES de calcular
                if (!profitInput || isNaN(parseFloatInput(profitInput.value)) || parseFloatInput(profitInput.value) < 0) {
                   showError('profit', 'Ingresá un porcentaje válido (>=0).'); isValid = false;
                }
                if (!portionsInput || isNaN(parseIntInput(portionsInput.value, 1)) || parseIntInput(portionsInput.value, 1) < 1) {
                   showError('portions', 'Ingresá porciones válidas (>=1).'); isValid = false;
                }
                break;
        }
        return isValid;
    };

    // --- Funciones de Navegación y Estado ---
    const updateProgress = () => {
        // Progreso basado en el paso *anterior* completado correctamente
        const progress = currentStep > 1 ? (((currentStep - 1) / (totalSteps)) * 100) : 0;
        if (progressBarFill) progressBarFill.style.width = `${progress}%`;

        progressSteps?.forEach((stepIndicator) => {
            const stepNum = parseInt(stepIndicator.dataset.step);
            stepIndicator.classList.toggle('active', stepNum === currentStep);
            stepIndicator.classList.toggle('completed', stepNum < currentStep);
        });
    };


    const showStep = (stepNumber) => {
        steps?.forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            clearStepErrors(nextStepElement); // Limpiar errores al mostrar
        } else {
            console.error(`Elemento del paso ${stepNumber} no encontrado.`);
        }
        updateProgress();
    };

    const saveCurrentStepData = () => {
        try {
            switch(currentStep) {
                case 1: recipeData.name = recipeNameInput?.value.trim() ?? ''; break;
                case 2: break; // Se guarda al añadir/eliminar
                case 3:
                    recipeData.packagingCost = parseFloatInput(packagingCostInput?.value);
                    recipeData.bakingCost = parseFloatInput(bakingCostInput?.value);
                    break;
                case 4:
                     recipeData.time = parseIntInput(timeInput?.value, 0);
                     recipeData.hourlyRate = parseFloatInput(hourlyRateInput?.value);
                     recipeData.laborCost = (recipeData.time / 60) * recipeData.hourlyRate;
                     calculateAndUpdateLaborCost(); // Actualizar display intermedio
                     break;
                 case 5: recipeData.fixedCost = parseFloatInput(fixedCostInput?.value); break;
                 case 6: // Se guardan antes de calcular
                    recipeData.profitPercentage = parseFloatInput(profitInput?.value);
                    recipeData.portions = parseIntInput(portionsInput?.value, 1);
                    break;
            }
        } catch (error) {
            console.error("Error guardando datos del paso:", currentStep, error);
        }
    };

    const goToNextStep = () => {
        if (validateStep(currentStep)) {
            saveCurrentStepData();
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 1) {
            // Opcional: ¿Guardar datos antes de retroceder? Podría ser útil si el usuario edita y vuelve.
            // saveCurrentStepData();
            currentStep--;
            showStep(currentStep);
        }
    };

    // --- Lógica Específica de Pasos ---

    // == PASO 2: Ingredientes ==
    const renderIngredientsList = () => {
        if (!ingredientsListUl) return;
        ingredientsListUl.querySelectorAll('li:not(.list-header):not(.list-empty)').forEach(li => li.remove());

        if (recipeData.ingredients.length === 0) {
            emptyListMsg?.classList.remove('hidden');
        } else {
             emptyListMsg?.classList.add('hidden');
             recipeData.ingredients.forEach(ing => {
                const li = document.createElement('li');
                li.dataset.id = ing.id;
                li.innerHTML = `
                    <span>${ing.name} (${ing.usedQty} ${ing.usedUnit})</span>
                    <span>${formatCurrency(ing.cost)}</span>
                    <span><button class="btn-delete-ing" title="Eliminar ${ing.name}">X</button></span>
                `;
                if (emptyListMsg) ingredientsListUl.insertBefore(li, emptyListMsg);
                else ingredientsListUl.appendChild(li);
                li.querySelector('.btn-delete-ing')?.addEventListener('click', handleDeleteIngredient);
            });
        }
        updateTotalIngredientCost();
    };

    const updateTotalIngredientCost = () => {
        recipeData.totalIngredientCost = recipeData.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
        if (ingredientsTotalSpan) {
            ingredientsTotalSpan.textContent = formatCurrency(recipeData.totalIngredientCost);
        }
    };

    const handleDeleteIngredient = (event) => {
        const button = event.target;
        const li = button.closest('li');
        if (!li || !li.dataset.id) return;
        const idToDelete = parseInt(li.dataset.id);
        recipeData.ingredients = recipeData.ingredients.filter(ing => ing.id !== idToDelete);
        renderIngredientsList();
        validateStep(2); // Revalidar por si queda vacío
    };

    const addIngredientHandler = () => {
        // Limpiar errores previos del formulario de ingredientes
        clearError('ing-name'); clearError('ing-price');
        clearError('ing-total-qty'); clearError('ing-used-qty');
        clearError('add-ingredient');
        toggleWarning(ingUnitWarning);

        const name = ingNameInput?.value.trim();
        const price = parseFloatInput(ingPriceInput?.value);
        const totalQty = parseFloatInput(ingTotalQtyInput?.value);
        const totalUnit = ingTotalUnitSelect?.value;
        const usedQty = parseFloatInput(ingUsedQtyInput?.value);
        const usedUnit = ingUsedUnitSelect?.value;
        let ingredientValid = true;

        if (!name) { showError('ing-name', 'Ingrediente requerido.'); ingredientValid = false; }
        if (price <= 0) { showError('ing-price', 'Precio debe ser mayor a 0.'); ingredientValid = false; }
        if (totalQty <= 0) { showError('ing-total-qty', 'Cantidad comprada debe ser mayor a 0.'); ingredientValid = false; }
        if (usedQty < 0) { showError('ing-used-qty', 'Cantidad usada no puede ser negativa.'); ingredientValid = false; }
        if (!areUnitsCompatible(totalUnit, usedUnit)) {
            toggleWarning(ingUnitWarning, `Unidades '${totalUnit}' y '${usedUnit}' no compatibles.`);
            ingredientValid = false;
        }

        if (!ingredientValid) return;

        const itemCost = calculateItemCost(totalQty, totalUnit, price, usedQty, usedUnit);
        if (isNaN(itemCost)) {
             showError('add-ingredient', 'Error al calcular costo. Revisá valores.');
             return;
        }

        recipeData.ingredients.push({ name, totalQty, totalUnit, price, usedQty, usedUnit, cost: itemCost, id: Date.now() });
        renderIngredientsList();
        validateStep(2); // Quita error de lista vacía si aplica

        // Limpiar formulario
        if(ingNameInput) ingNameInput.value = '';
        if(ingPriceInput) ingPriceInput.value = '';
        if(ingTotalQtyInput) ingTotalQtyInput.value = '';
        if(ingUsedQtyInput) ingUsedQtyInput.value = '';
        ingNameInput?.focus();
    };

    // == PASO 4: Mano de Obra ==
    const calculateAndUpdateLaborCost = () => {
        const time = parseIntInput(timeInput?.value, 0);
        const rate = parseFloatInput(hourlyRateInput?.value);
        const cost = (rate >= 0 && time >= 0) ? (time / 60) * rate : 0; // Calcular solo si son válidos
        if (laborCostDisplay) {
            laborCostDisplay.textContent = formatCurrency(cost);
        }
        // Guardar en recipeData se hace en saveCurrentStepData
    };

    // == PASO 6: Cálculo Final ==
    const calculateFinalResults = () => {
        if (!validateStep(6)) { // Validar campos de este paso primero
             finalResultsDiv?.classList.add('hidden');
             if(generatePdfBtn) generatePdfBtn.disabled = true;
             return false;
        }

        saveCurrentStepData(); // Guardar profit y porciones

        // Recalcular totales
        recipeData.totalIngredientCost = recipeData.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
        recipeData.totalMaterialCost = recipeData.totalIngredientCost + recipeData.packagingCost + recipeData.bakingCost;
        recipeData.laborCost = (recipeData.time / 60) * recipeData.hourlyRate; // Asegurar último valor
        recipeData.totalCost = recipeData.totalMaterialCost + recipeData.laborCost + recipeData.fixedCost;
        recipeData.profitAmount = recipeData.totalCost * (recipeData.profitPercentage / 100);
        recipeData.finalPrice = recipeData.totalCost + recipeData.profitAmount;
        recipeData.portionPrice = recipeData.portions > 0 ? recipeData.finalPrice / recipeData.portions : 0;

        // Mostrar resultados
        if(resRecipeName) resRecipeName.textContent = recipeData.name || 'Tu Receta';
        if(resMaterial) resMaterial.textContent = formatCurrency(recipeData.totalMaterialCost);
        if(resLabor) resLabor.textContent = formatCurrency(recipeData.laborCost);
        if(resFixed) resFixed.textContent = formatCurrency(recipeData.fixedCost);
        if(resTotalCost) resTotalCost.textContent = formatCurrency(recipeData.totalCost);
        if(resProfitPerc) resProfitPerc.textContent = recipeData.profitPercentage;
        if(resProfit) resProfit.textContent = formatCurrency(recipeData.profitAmount);
        if(resPortions) resPortions.textContent = recipeData.portions;
        if(resFinalPrice) resFinalPrice.textContent = formatCurrency(recipeData.finalPrice);
        if(resPortionPrice) resPortionPrice.textContent = formatCurrency(recipeData.portionPrice);

        finalResultsDiv?.classList.remove('hidden');
        if (generatePdfBtn) {
            generatePdfBtn.disabled = !jsPDF_is_loaded; // Habilitar solo si jsPDF está ok
             if (!jsPDF_is_loaded) {
                 showError('pdf', 'La librería PDF no está cargada.');
             } else {
                 clearError('pdf');
             }
        }
        return true;
    };

    // == GENERACIÓN DE PDF ==
    const generateRecipePDF = () => {
        if (!jsPDF_is_loaded) {
            showError('pdf', 'Error: La librería jsPDF no está cargada.');
            return;
        }

        pdfLoader?.classList.remove('hidden');
        if(generatePdfBtn) generatePdfBtn.disabled = true;
        clearError('pdf'); // Limpiar errores previos

        // Usar setTimeout para permitir que el loader se muestre antes de bloquear el hilo
        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                const margin = 15;
                let currentY = margin;

                // --- Título ---
                doc.setFontSize(18); doc.setFont(undefined, 'bold');
                doc.text('Resumen de Costos de Receta', pageWidth / 2, currentY, { align: 'center' });
                currentY += 12; // Más espacio

                // --- Nombre de la Receta ---
                doc.setFontSize(14); doc.setFont(undefined, 'normal');
                doc.text(`Receta: ${recipeData.name || 'Sin Nombre'}`, margin, currentY);
                currentY += 12;

                // --- Tabla de Ingredientes ---
                if (jsPDF_AutoTable_is_loaded && typeof doc.autoTable === 'function') {
                    const head = [['Ingrediente', 'Cant. Usada', 'Unidad', 'Costo']];
                    const body = recipeData.ingredients.map(ing => [
                        ing.name, ing.usedQty, ing.usedUnit, formatCurrency(ing.cost)
                    ]);
                    doc.autoTable({
                        head: head, body: body, startY: currentY,
                        margin: { left: margin, right: margin }, theme: 'grid',
                        headStyles: { fillColor: [236, 72, 153] }, // #ec4899 pink-500
                        styles: { fontSize: 9, cellPadding: 2 },
                        columnStyles: { 3: { halign: 'right' } },
                        didDrawPage: (data) => addPdfFooter(doc, data.pageNumber, doc.internal.getNumberOfPages())
                    });
                    currentY = doc.autoTable.previous.finalY + 10;
                } else {
                    // Fallback sin autoTable
                    doc.setFontSize(10);
                    doc.text('Ingredientes:', margin, currentY); currentY += 5;
                    recipeData.ingredients.forEach(ing => {
                        if (currentY > pageHeight - margin - 15) { // Margen inferior para footer
                            addPdfFooter(doc, doc.internal.getPageInfo(doc.internal.getCurrentPageInfo().pageNumber).pageNumber, doc.internal.getNumberOfPages());
                            doc.addPage(); currentY = margin;
                        }
                        doc.text(`- ${ing.name} (${ing.usedQty} ${ing.usedUnit}): ${formatCurrency(ing.cost)}`, margin + 5, currentY);
                        currentY += 5;
                    });
                    currentY += 5;
                }

                 // Añadir salto de página si queda poco espacio antes de costos
                 if (pageHeight - currentY < 60) { // Espacio estimado para costos+precios
                     addPdfFooter(doc, doc.internal.getPageInfo(doc.internal.getCurrentPageInfo().pageNumber).pageNumber, doc.internal.getNumberOfPages());
                     doc.addPage(); currentY = margin;
                 }


                // --- Desglose de Costos ---
                doc.setFontSize(12); doc.setFont(undefined, 'bold');
                doc.text('Desglose de Costos:', margin, currentY); currentY += 7;
                doc.setFontSize(10); doc.setFont(undefined, 'normal');

                const costs = [
                    { label: 'Costo Total Ingredientes:', value: formatCurrency(recipeData.totalIngredientCost) },
                    { label: 'Costo Packaging:', value: formatCurrency(recipeData.packagingCost) },
                    { label: 'Costo Horneado/Servicios:', value: formatCurrency(recipeData.bakingCost) },
                    { label: '-> Costo Total Materiales:', value: formatCurrency(recipeData.totalMaterialCost), bold: true },
                    { label: 'Costo Mano de Obra (Tu Tiempo):', value: formatCurrency(recipeData.laborCost) },
                    { label: 'Costo Gastos Fijos (Porción):', value: formatCurrency(recipeData.fixedCost) },
                    { label: '==> COSTO TOTAL RECETA:', value: formatCurrency(recipeData.totalCost), bold: true, color: [219, 39, 119] }, // #db2777 pink-600
                ];
                 drawKeyValueLines(doc, costs, margin, currentY, pageHeight);
                 currentY = doc.previousKeyValueY || currentY; // Actualizar Y después de dibujar


                // --- Precio y Ganancia ---
                 currentY += 5; // Espacio
                 if (pageHeight - currentY < 40) { // Espacio estimado
                     addPdfFooter(doc, doc.internal.getPageInfo(doc.internal.getCurrentPageInfo().pageNumber).pageNumber, doc.internal.getNumberOfPages());
                     doc.addPage(); currentY = margin;
                 }

                 doc.setFontSize(12); doc.setFont(undefined, 'bold');
                 doc.text('Precio de Venta Sugerido:', margin, currentY); currentY += 7;
                 doc.setFontSize(10); doc.setFont(undefined, 'normal');

                 const pricing = [
                     { label: `Ganancia Estimada (${recipeData.profitPercentage}%):`, value: formatCurrency(recipeData.profitAmount) },
                     { label: 'PRECIO DE VENTA SUGERIDO:', value: formatCurrency(recipeData.finalPrice), bold: true, color: [22, 163, 74] }, // #16a34a green-600
                     { label: `Precio Sugerido por Porción (x${recipeData.portions}):`, value: formatCurrency(recipeData.portionPrice) }
                 ];
                 drawKeyValueLines(doc, pricing, margin, currentY, pageHeight);
                 currentY = doc.previousKeyValueY || currentY;


                // --- Añadir pie de página a la ÚLTIMA página ---
                addPdfFooter(doc, doc.internal.getPageInfo(doc.internal.getCurrentPageInfo().pageNumber).pageNumber, doc.internal.getNumberOfPages());

                // --- Guardar PDF ---
                doc.save(`Costos_${(recipeData.name || 'Receta').replace(/[^a-z0-9]/gi, '_')}.pdf`);

            } catch (error) {
                console.error("Error al generar el PDF:", error);
                showError('pdf', 'Ocurrió un error al generar el PDF.');
            } finally {
                pdfLoader?.classList.add('hidden');
                if(generatePdfBtn) generatePdfBtn.disabled = false; // Habilitar de nuevo
                if (postPdfModal) {
                    try {
                       postPdfModal.showModal(); // Muestra el diálogo modal
                    } catch (modalError) {
                       console.error("Error al mostrar el modal:", modalError);
                       // Podrías mostrar un error alternativo si el modal falla
                    }
                 }
            }
        }, 100); // 100ms delay
    };

     /** Dibuja líneas clave-valor en el PDF, manejando saltos de página */
     const drawKeyValueLines = (doc, items, margin, startY, pageHeight) => {
         let currentY = startY;
         const pageWidth = doc.internal.pageSize.width;
         doc.previousKeyValueY = startY; // Guardar la Y inicial para devolverla

         items.forEach(item => {
             if (currentY > pageHeight - margin - 10) { // Salto de página
                 addPdfFooter(doc, doc.internal.getPageInfo(doc.internal.getCurrentPageInfo().pageNumber).pageNumber, doc.internal.getNumberOfPages());
                 doc.addPage(); currentY = margin;
             }
             const isBold = item.bold || false;
             const textColor = item.color || [0, 0, 0]; // Negro por defecto

             doc.setFont(undefined, isBold ? 'bold' : 'normal');
             doc.setTextColor(textColor[0], textColor[1], textColor[2]);

             doc.text(item.label, margin, currentY);
             doc.text(item.value, pageWidth - margin, currentY, { align: 'right' });

             doc.setFont(undefined, 'normal'); // Reset
             doc.setTextColor(0, 0, 0);
             currentY += 6; // Espacio entre líneas
         });
         doc.previousKeyValueY = currentY; // Guardar la Y final
     };


     /** Añade el pie de página al PDF */
     const addPdfFooter = (doc, pageNum, totalPages) => {
         const pageHeight = doc.internal.pageSize.height;
         const pageWidth = doc.internal.pageSize.width;
         const margin = 15;
         const footerY = pageHeight - margin + 5;

         doc.setFontSize(8);
         doc.setTextColor(150, 150, 150); // Gris más claro

         const disclaimer = "PDF generado desde la web de Excel-ente de manera gratuita. La información proporcionada debe ser revisada y confirmada.";
         doc.text(disclaimer, margin, footerY);
         doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

         doc.setTextColor(0, 0, 0); // Reset color
     };


    // --- Event Listeners ---
    nextButtons?.forEach(button => button.addEventListener('click', goToNextStep));
    prevButtons?.forEach(button => button.addEventListener('click', goToPrevStep));
    addIngredientBtn?.addEventListener('click', addIngredientHandler);

    ingTotalUnitSelect?.addEventListener('change', () => {
        updateCompatibleUsedUnits(ingTotalUnitSelect, ingUsedUnitSelect, null); // Llama a la función local/integrada
        toggleWarning(ingUnitWarning);
    });
    ingUsedUnitSelect?.addEventListener('change', () => {
         if (!areUnitsCompatible(ingTotalUnitSelect.value, ingUsedUnitSelect.value)) {
             toggleWarning(ingUnitWarning, `Unidades '${ingTotalUnitSelect.value}' y '${ingUsedUnitSelect.value}' no compatibles.`);
         } else {
             toggleWarning(ingUnitWarning);
         }
     });

    timeInput?.addEventListener('input', calculateAndUpdateLaborCost);
    hourlyRateInput?.addEventListener('input', calculateAndUpdateLaborCost);
    calculateFinalBtn?.addEventListener('click', calculateFinalResults);
    generatePdfBtn?.addEventListener('click', generateRecipePDF);

    // Limpiar errores al escribir
    const inputsToClearErrorOnChange = [
        recipeNameInput, ingNameInput, ingPriceInput, ingTotalQtyInput, ingUsedQtyInput,
        packagingCostInput, bakingCostInput, timeInput, hourlyRateInput,
        fixedCostInput, profitInput, portionsInput
    ];
    inputsToClearErrorOnChange.forEach(input => {
        input?.addEventListener('input', () => {
            // Obtener el ID y quitar 'guide-' si existe para llamar a clearError
            const baseId = input.id.startsWith('guide-') ? input.id.substring(6) : input.id;
            clearError(baseId);
        });
    });


    // --- Inicialización ---
    if (steps.length > 0) {
        showStep(currentStep); // Mostrar el primer paso
        updateCompatibleUsedUnits(ingTotalUnitSelect, ingUsedUnitSelect, 'g'); // Inicializar unidades
        renderIngredientsList(); // Mostrar lista vacía
        calculateAndUpdateLaborCost(); // Calcular costo laboral inicial
    } else {
        console.warn("No se encontraron elementos de pasos (.step) en la página.");
    }


}); // Fin DOMContentLoaded