 const theForm = document.querySelector('.creditCard');
 const creditCardContainer = document.querySelector('#creditCardNumberContainer');
 const creditInput = document.querySelector('#creditCardNumberContainer input');


 function displayError(msg) {
	// display error message
	document.querySelector('.errors').textContent = msg
}

function isCardNumberValid(number) {
	return number === '1234123412341234'
}

function submitHandler(event) {
	event.preventDefault();
  let errorMsg = '';
	displayError('');

  let cardNumber = document.querySelector('#creditCardNumber');
  const cardNum = cardNumber.value.trim();
  if (paymentSelect.value === 'creditCard') {
    // Check if it's numeric and valid in one go
    
      if (!/^\d{16}$/.test(cardNum)) {
      errorMsg += 'Card number must be 16 digits\n';
      } else if (!isCardNumberValid(cardNum)) {
        errorMsg += 'Card number is not valid\n';
      }
    
    //check date
    const expYear = Number(document.querySelector('#year').value);   
    const expMonth = Number(document.querySelector('#month').value);
    const currentDate = new Date()

    if (2000 + expYear < currentDate.getFullYear() || (2000 + expYear === currentDate.getFullYear() && expMonth <= (currentDate.getMonth()))
    ) {
        errorMsg += 'Card is expired\n';
    }
  }

    if (errorMsg !== '') {
		// there was an error. stop the form and display the errors.
		displayError(errorMsg)
		return;
    }
    // Success: show a confirmation message
    const formContainer = document.getElementById('creditCard');
    formContainer.innerHTML = '<h2>Thank you!</h2>';

}

document.querySelector('.creditCard').addEventListener('submit', submitHandler)