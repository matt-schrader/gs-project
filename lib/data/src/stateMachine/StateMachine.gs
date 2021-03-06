import sys.Component
import macro sys.stateMachine

class! extends Component
	def currentStateName = null
	def initialState = null
	def states = null
	def currentAction = null
	def currentActionData = null
	
	def initialize()
		callSuper initialize
		@states := @getStates()
		_(@):one ready()@
			if @initialState and not @currentStateName?
				@transition @initialState
	
	def getStates() -> []
	
	def handle(action,...data)
		@[action]? ...data
		unless @currentStateName?
			if typeof @catchAll == \function; @catchAll action, ...data
			return
		// This may need to be optimized, eg, no for loop.
		let handlerName = for first handlerName in [action,\catchAll]
			let _handlerName = "state_$(@currentStateName)_$(handlerName)"
			if typeof @[_handlerName] == 'function'; _handlerName
		die unless handlerName?
		let setCurrentAction = not @currentAction?
		if setCurrentAction
			@currentAction := action
			@currentActionData := data
		let result = @[handlerName](...data)
		if setCurrentAction
			@currentAction := @currentActionData := null
		result
				
	def transition(stateName,...data)
		die if stateName == @currentStateName
		die unless stateName in @states
			throw 'Invalid state name '&stateName
		if @currentStateName?; @handle \exit, ...data
		@currentStateName := stateName
		let res = @handle \enter, ...data
		@emitEvent \transition
		res
	
	def deferUntilTransition(state)
		die unless @currentStateName? and @currentAction?
		let action = @currentAction
		let actionData = @currentActionData
		let event = #@
			die if state? and state != @currentStateName
			@removeEventListener \transition, event
			@handle action, ...actionData
		@addEventListener \transition, event
	
	def saveState()
		{@currentStateName}
	
	def restoreState(savedState)
		if savedState.currentStateName?
			@transition savedState.currentStateName