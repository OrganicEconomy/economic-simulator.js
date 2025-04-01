// const Matter = require('matter-js')
const { describe, it } = require('mocha')
const { assert } = require('chai')
const sinon = require('sinon')

const { Person, AbstractWallet, Wallet, OrganicWallet, HumanResourcesHandler, AdminService } = require('../src/index')


describe('AbstractWallet', () => {
	describe('income', () => {
		it('Should increase the wallet cash.', () => {
			let wallet = new AbstractWallet(sinon.createStubInstance(Person))
			wallet.updateSize = sinon.fake()

			wallet.income(12)

			assert.equal(wallet.cash, 12)
		})
	})

	describe('getSizingRatio', () => {
		it('Should return ratio = 2 when it was cashed from 10 to 25.', () => {
			let wallet = new AbstractWallet(sinon.createStubInstance(Person))
			wallet.income(25)

			let result = wallet.getSizingRatio(15)

			assert.equal(result, 2)
		})

		it('Should return ratio = 1/2 when it was uncashed from 10 to 2.5.', () => {
			let wallet = new AbstractWallet(sinon.createStubInstance(Person))
			wallet.income(2.5)


			let result = wallet.getSizingRatio(-7.5)

			assert.equal(result, 0.5)
		})
	})
})

describe('Wallet', () => {
	describe('destroyMoney', () => {
		it('Should decrease the wallet cash.', () => {
			let wallet = new Wallet(sinon.createStubInstance(Person))
			wallet.income(4)

			wallet.destroyMoney(3)

			assert.equal(wallet.cash, 1)
		})
	})

	describe('pay', () => {
		it('Should call income to target with given amount.', () => {
			let wallet = new Wallet(sinon.createStubInstance(Person))
			wallet.income(4)
			let target = sinon.createStubInstance(Person)

			wallet.pay(target, 4)

			sinon.assert.calledOnce(target.income)
		})

		it('Should decrease the wallet cash.', () => {
			let wallet = new Wallet(sinon.createStubInstance(Person), 4)
			let target = sinon.createStubInstance(Person)
			wallet.pay(target, 4)

			assert.equal(wallet.cash, 0)
		})

		it('Should return 0 if wallet cannot afford the amount.', () => {
			let wallet = new Wallet(4)
			let target = sinon.createStubInstance(Person)

			let result = wallet.pay(target, 5)

			assert.equal(result, 0)
		})

		it('Should return the amount if wallet could afford it.', () => {
			let wallet = new Wallet(sinon.createStubInstance(Person))
			wallet.income(4)
			let target = sinon.createStubInstance(Person)

			let result = wallet.pay(target, 4)

			assert.equal(result, 4)
		})
	})
})

describe('OrganicWallet', () => {
	describe('income', () => {
		it('Should increase the wallet total.', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))

			wallet.income(12)

			assert.equal(wallet.total, 12)
		})
	})

	describe('createDailyMoney', () => {
		it('Should increase the wallet cash (t=0 => m=1).', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))

			wallet.createDailyMoney()

			assert.equal(wallet.cash, 1)
		})

		it('Should increase the wallet cash (t=1 => m=2).', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))

			wallet.income(1)
			wallet.createDailyMoney()

			assert.equal(wallet.cash, 2)
		})

		it('Should increase the wallet cash (t=8 => m=3).', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))

			wallet.income(8)
			wallet.createDailyMoney()

			assert.equal(wallet.cash, 3)
		})

		it('Should increase the wallet cash (t=27 => m=4).', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))

			wallet.income(27)
			wallet.createDailyMoney()

			assert.equal(wallet.cash, 4)
		})
	})

	describe('pay', () => {
		it('Should call income to target with given amount.', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))
			let target = sinon.createStubInstance(Person)

			wallet.income(27)
			wallet.createDailyMoney()
			wallet.pay(target, 4)

			sinon.assert.calledOnce(target.income)
		})

		it('Should decrease the wallet cash.', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person))
			let target = sinon.createStubInstance(Person)

			wallet.income(27)
			wallet.createDailyMoney()
			wallet.pay(target, 4)

			assert.equal(wallet.cash, 0)
		})

		it('Should return 0 if wallet cannot afford the amount.', () => {
			let wallet = new OrganicWallet(4)
			let target = sinon.createStubInstance(Person)

			let result = wallet.pay(target, 5)

			assert.equal(result, 0)
		})

		it('Should return the amount if wallet could afford it.', () => {
			let wallet = new OrganicWallet(sinon.createStubInstance(Person), 4)
			let target = sinon.createStubInstance(Person)

			wallet.income(27)
			wallet.createDailyMoney()
			let result = wallet.pay(target, 4)

			assert.equal(result, 4)
		})
	})
})

describe('HumanResourcesHandler', () => {
	describe('getRecruit', () => {
		it('Should return the first recruit in the given people.', () => {
			let humanResource = new HumanResourcesHandler([0, 1, 2])

			let result = humanResource.getRecruit()

			assert.equal(result, 2)
		})

		it('Should return null if there is no people available.', () => {
			let humanResource = new HumanResourcesHandler([])

			let result = humanResource.getRecruit()

			assert.isNull(result)
		})

		it('Should add the returned recruit to the busyPeople.', () => {
			let humanResource = new HumanResourcesHandler([0])

			humanResource.getRecruit()

			assert.deepEqual(humanResource.availablePeople, [])
			assert.deepEqual(humanResource.busyPeople, [0])
		})
	})

	describe('freeRecruit', () => {
		it('Should update busyPeople and availablePeople.', () => {
			let humanResource = new HumanResourcesHandler([0, 1, 2])
			humanResource.getRecruit()
			humanResource.getRecruit()

			humanResource.freeRecruit(1)

			assert.deepEqual(humanResource.availablePeople, [1, 0])
			assert.deepEqual(humanResource.busyPeople, [2])
		})
	})
})

describe('AdminService', () => {
	describe('recruitAnEmployee', () => {
		it('Should add recruits to employees.', () => {
			let people = [0, 1, 2]
			let adminService = new AdminService(new Wallet(), new HumanResourcesHandler(people))

			adminService.recruitAnEmployee()
			adminService.recruitAnEmployee()

			assert.deepEqual(adminService.employees, [2, 1])
		})
	})

	describe('fireAnEmployee', () => {
		it('Should remove lase recruit from employees.', () => {
			let people = [0, 1, 2]
			let adminService = new AdminService(new Wallet(), new HumanResourcesHandler(people))

			adminService.recruitAnEmployee()
			adminService.recruitAnEmployee()
			adminService.fireAnEmployee()

			assert.deepEqual(adminService.employees, [2])
		})
	})
})
