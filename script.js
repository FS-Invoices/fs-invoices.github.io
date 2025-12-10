// Initialize with today's date
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('issueDate').value = today;
    
    // Set expiration date to 30 days from today
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    document.getElementById('expirationDate').value = expirationDate.toISOString().split('T')[0];
    
    // Add event listeners for live preview
    document.getElementById('quoteNumber').addEventListener('input', updatePreview);
    document.getElementById('issueDate').addEventListener('input', updatePreview);
    document.getElementById('expirationDate').addEventListener('input', updatePreview);
    document.getElementById('recipientInfo').addEventListener('input', updatePreview);
    document.getElementById('includeTax').addEventListener('change', updatePreview);
    if (document.getElementById('showPerGbMonth')) {
        document.getElementById('showPerGbMonth').addEventListener('change', updatePreview);
    }
    // Initial preview update
    updatePreview();
});

function addItem() {
    const container = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <input type="text" class="item-description" placeholder="Name" oninput="updatePreview()">
        <input type="number" class="item-quantity" placeholder="QTY" min="0" step="0.01" oninput="updatePreview()">
        <input type="number" class="item-price" placeholder="Rate" min="0.01" step="0.01" oninput="updatePreview()">
        <select class="item-period" onchange="updatePreview()">
            <option value="">One-time</option>
            <option value="GBs">GBs</option>
            <option value="GBs /month">GBs /month</option>
            <option value="/month">/month</option>
            <option value="GBs /year">GBs /year</option>
            <option value="/year">/year</option>
        </select>
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
    `;
    container.appendChild(itemRow);
    updatePreview();
}

function removeItem(button) {
    button.parentElement.remove();
    updatePreview();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatCurrency(amount, period = '') {
    const value = parseFloat(amount || 0);
    // Round to 2 decimal places
    const rounded = Math.round(value * 100) / 100;
    // Display as integer if whole number, otherwise 2 decimals
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
    const result = '$' + formatted;
    if (period) {
        return result + ' <span class="rate-period">' + period + '</span>';
    }
    return result;
}

function formatRate(amount, period = '') {
    const rateValue = parseFloat(amount || 0);
    if (rateValue === 0) return '$0';
    const formatted = '$' + rateValue.toFixed(2);
    let firstLine = formatted;
    let secondLine = '';
    if (period === 'per GB/month') {
        secondLine = '<span class="rate-period">per GB/month</span>';
    } else if (period === '/month') {
        secondLine = '<span class="rate-period">/month</span>';
    }
    return firstLine + (secondLine ? '<br>' + secondLine : '');
}

function updatePreview() {
    // Update quote number
    const quoteNumber = document.getElementById('quoteNumber').value || '-';
    document.getElementById('previewQuoteNumber').textContent = quoteNumber;
    
    // Update dates
    document.getElementById('previewIssueDate').textContent = formatDate(document.getElementById('issueDate').value);
    document.getElementById('previewExpirationDate').textContent = formatDate(document.getElementById('expirationDate').value);
    
    // Update recipient
    const recipientInfo = document.getElementById('recipientInfo').value;
    if (recipientInfo) {
        document.getElementById('previewRecipient').textContent = recipientInfo;
    } else {
        document.getElementById('previewRecipient').innerHTML = 'LINE<br>LINE<br>LINE<br>LINE<br>LINE';
    }
    
    // Update items
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRows = itemsContainer.querySelectorAll('.item-row');
    const previewItems = document.getElementById('previewItems');
    previewItems.innerHTML = '';
    
    let subtotal = 0;
    let hasMonthlyItems = false;
    
    if (itemRows.length === 0) {
        previewItems.innerHTML = '<tr><td colspan="4" class="empty-message">No items added</td></tr>';
    } else {
        const showPerGbMonth = document.getElementById('showPerGbMonth') ? document.getElementById('showPerGbMonth').checked : true;
        itemRows.forEach(row => {
            const description = row.querySelector('.item-description').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const priceInput = row.querySelector('.item-price');
            let price = parseFloat(priceInput.value) || 0;
            
            // Enforce minimum of 0.01 for rate
            if (price > 0 && price < 0.01) {
                price = 0.01;
                priceInput.value = 0.01;
            }
            
            const period = row.querySelector('.item-period').value || '';
            const total = quantity * price;
            subtotal += total;
            
            if (period === '/month' || period === 'per GB/month') {
                hasMonthlyItems = true;
            }
            if (description || quantity || price) {
                const tr = document.createElement('tr');
                const rateValue = price > 0 ? price : 0;
                // Use new formatRate
                const rateDisplay = formatRate(rateValue, period);
                tr.innerHTML = `
                    <td>${description || '-'}</td>
                    <td>${Math.round(quantity)}</td>
                    <td>${rateDisplay}</td>
                    <td>${formatCurrency(total)}</td>
                `;
                previewItems.appendChild(tr);
            }
        });
        
        if (previewItems.children.length === 0) {
            previewItems.innerHTML = '<tr><td colspan="4" class="empty-message">No items added</td></tr>';
        }
    }
    
    // Update tax note
    const includeTax = document.getElementById('includeTax').checked;
    const taxNoteRow = document.getElementById('taxNoteRow');
    if (includeTax) {
        taxNoteRow.style.display = 'none';
    } else {
        taxNoteRow.style.display = 'flex';
        taxNoteRow.style.justifyContent = 'flex-end';
    }
    
    // Update totals
    const totalPeriod = hasMonthlyItems ? '/month' : '';
    // Round to 2 decimal places for display
    const subtotalValue = Math.round(subtotal * 100) / 100;
    const totalValue = Math.round(subtotal * 100) / 100;
    
    // Format with 2 decimal places if needed, otherwise show as integer
    const subtotalDisplay = subtotalValue % 1 === 0 ? subtotalValue.toString() : subtotalValue.toFixed(2);
    const totalDisplay = totalValue % 1 === 0 ? totalValue.toString() : totalValue.toFixed(2);
    
    document.getElementById('previewSubtotal').textContent = '$' + subtotalDisplay;
    
    if (totalPeriod) {
        document.getElementById('previewTotal').innerHTML = '$' + totalDisplay + 
            ' <span class="rate-period">' + totalPeriod + '</span>';
    } else {
        document.getElementById('previewTotal').textContent = '$' + totalDisplay;
    }
}

function downloadPDF() {
    const element = document.getElementById('quotePreview');
    
    if (!element) {
        alert('Preview element not found');
        return;
    }
    
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }
    
    const downloadBtn = document.querySelector('.download-btn');
    const originalText = downloadBtn ? downloadBtn.textContent : 'Download PDF';
    
    if (downloadBtn) {
        downloadBtn.textContent = 'Generating PDF...';
        downloadBtn.disabled = true;
    }
    
    // Ensure element is visible and has proper dimensions
    const originalStyles = {
        display: element.style.display || '',
        visibility: element.style.visibility || '',
        position: element.style.position || '',
        width: element.style.width || '',
        height: element.style.height || ''
    };
    
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.position = 'relative';
    
    // Wait a moment for rendering
    setTimeout(function() {
        try {
            const opt = {
                margin: [0, 0, 0, 0],
                filename: `quote-${document.getElementById('quoteNumber').value || 'document'}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    letterRendering: true,
                    allowTaint: false,
                    scrollX: 0,
                    scrollY: 0,
                },
                jsPDF: { 
                    unit: 'in', 
                    format: 'letter', 
                    orientation: 'portrait',
                    compress: true
                }
            };
            
            html2pdf().set(opt).from(element).save().then(function() {
                // Restore original styles
                element.style.display = originalStyles.display;
                element.style.visibility = originalStyles.visibility;
                element.style.position = originalStyles.position;
                element.style.width = originalStyles.width;
                element.style.height = originalStyles.height;
                
                if (downloadBtn) {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }
            }).catch(function(error) {
                console.error('PDF generation error:', error);
                console.error('Error details:', error.message, error.stack);
                
                // Restore original styles
                element.style.display = originalStyles.display;
                element.style.visibility = originalStyles.visibility;
                element.style.position = originalStyles.position;
                element.style.width = originalStyles.width;
                element.style.height = originalStyles.height;
                
                alert('Error generating PDF: ' + (error.message || 'Unknown error. Please check the browser console for details.'));
                
                if (downloadBtn) {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }
            });
        } catch (error) {
            console.error('PDF setup error:', error);
            alert('Error setting up PDF generation: ' + error.message);
            
            // Restore original styles
            element.style.display = originalStyles.display;
            element.style.visibility = originalStyles.visibility;
            element.style.position = originalStyles.position;
            element.style.width = originalStyles.width;
            element.style.height = originalStyles.height;
            
            if (downloadBtn) {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        }
    }, 200);
}
