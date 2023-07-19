let links = {
	order_page: '',
	application_domain: ''
};
const VODACOM_PHONE_NUMBER_REGEX = /^(\+|00)?(258)?((84|85)\d{7})$/
const responseCodes = {
	'INS-1': 'Internal Error',
	'INS-2': 'Invalid API Key',
	'INS-4': 'User is not active',
	'INS-5': 'Transaction cancelled by customer',
	'INS-6': 'Transaction Failed',
	'INS-9': 'Request timeout',
	'INS-10': 'Duplicate Transaction',
	'INS-13': 'Invalid Shortcode Used',
	'INS-14': 'Invalid Reference Used',
	'INS-15': 'Invalid Amount Used',
	'INS-16': 'Unable to handle the request due to a temporary overloading',
	'INS-17 ': 'Invalid Transaction Reference. Length Should Be Between 1 and 20.',
	'INS-18': 'Invalid TransactionID Used',
	'INS-19': 'Invalid ThirdPartyReference Used',
	'INS-20': 'Not All Parameters Provided. Please try again.',
	'INS-21': 'Parameter validations failed. Please try again.',
	'INS-22': 'Invalid Operation Type',
	'INS-23': 'Unknown Status. Contact M-Pesa Support',
	'INS-24': 'Invalid InitiatorIdentifier Used',
	'INS-25': 'Invalid SecurityCredential Used',
	'INS-26': 'Not authorized',
	'INS-993': 'Direct Debit Missing',
	'INS-994': 'Direct Debit Already Exists',
	'INS-995': "Customer's Profile Has Problems",
	'INS-996': 'Customer Account Status Not Active',
	'INS-997': 'Linking Transaction Not Found',
	'INS-998': 'Invalid Market',
	'INS-2001': 'Initiator authentication error.',
	'INS-2002': 'Receiver invalid.',
	'INS-2005': 'Rule limited.',
	'INS-2006': 'Insufficient balance',
	'INS-2051': 'MSISDN invalid.',
	'INS-2057': 'Language code invalid.',
}
async function initializePayment(encrypted_data, linksResponse){
	links.application_domain = JSON.parse(linksResponse)['application_domain'];
	links.order_page = JSON.parse(linksResponse)['order_page'];
	let userData = JSON.parse(window.atob(encrypted_data));

	await Swal.fire({
		title: 'Confirme o número  a ser usado',
		input: 'number',
		type: 'question',
		inputValue: userData['tel'],
		allowOutsideClick: false,
		confirmButton: 'OK',
		showCancelButton: true,
		inputValidator: (number) => {
			if (!number.match(VODACOM_PHONE_NUMBER_REGEX)){
				return "Introduza um número válido";
			}
		}
	}).then(function(response){
		if(response['value']){
            this.processPayment(response.value, encrypted_data, links.application_domain);
            console.log(response.value);
		}else{
            console.log("cancelado");
            console.log(response);
		}
	});
}

function processPayment(numero, encrypted_data) {
	this.showLoading();
	fetch(`${links.application_domain}/?initialize_payment=1`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify({
			numero,
			encrypted_data,
		})
	}).then(response => {
		if (response.ok) {
			return response.json();
		} else {
			console.error("show error message");
			throw new Error('Network response was not ok.');
		}
	}).then(responseData => {
			Swal.close();
			console.log(responseData);
			this.showMessageToUser(responseData);
		}).catch(error => {
			Swal.close();
			this.disableButton(false);
			this.showErrorMessage("Ocorreu um erro inesperado");
			console.log(error);
			if (error.response) {
				console.log({errorResponse: error.response.data});
				console.log({errorStatus: error.response.status});
				console.log({errorHeaders: error.response.headers});
			} else if (error.request) {
				console.log({errorRequest: error});
			} else {
				console.log({errorMessage: error.message});
			}
		});
}


function showMessageToUser(response) {
	this.disableButton(false);
	if (responseCodes[response['output_ResponseCode']] && response['output_ResponseCode'] !== 'INS-0') {
		this.showErrorMessage(responseCodes[response['output_ResponseCode']]);
	} else if (response['output_ResponseCode'] === 'INS-0') {
		this.showSuccessMessage("Pagamento efectuado com Sucesso", response['output_ResponseCode'], response['output_ResponseDesc ']);
		this.disableButton(true);
	} else {
		this.showErrorMessage("Ocorreu um erro Inesperado, Tente Novamente");
	}
}


function showSuccessMessage(message, responseCode, responseDescription){
    Swal.fire({
        title: message,
        allowOutsideClick: false,
		confirmButtonText: 'Finalizar',
        html: 'Parabens, click <strong>Finalizar</strong> para continuar',
        type: 'success',
    }).then(function () {
        this.finalizePayment(responseCode, responseDescription );
    });
}

function showErrorMessage(message){
	Swal.fire({
		title: message,
		text: 'Tente Novamente, por favor',
		type: 'error',
        allowOutsideClick: false,
	});
}

/**
 * Finaliza o Pagamento
 */
function finalizePayment(code, description){

    Swal.fire({
        title: "Finalizando...",
        text: "A tua encomenda está a ser finalizada",
        allowOutsideClick: false,
        onBeforeOpen: () => {
            Swal.showLoading();
        }
    });
    console.log('Processado');
	fetch(`${links.application_domain}/?payment_action`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			code: code,
			description: description,
		}),
	}).then(response => {
		if (response.ok) {
			Swal.close();
			window.location.href = links.order_page;
		} else {
			throw new Error('Network response was not ok.');
		}
	}).catch(error => {
		Swal.close();
		console.log(error);
		this.showErrorMessage("Ocorreu algum erro ao Finalizar");
	});
}


/**
 * Show tree dots loading
 */
function showLoading(){
    Swal.fire({
        title: "Processado...",
        text: "Verifique o seu Telemove por favor",
        allowOutsideClick: false,
		onBeforeOpen: () => {
        	Swal.showLoading();
		}
    });
}

function disableButton(flag){
	document.getElementById('pay_btn').disabled = flag;
}