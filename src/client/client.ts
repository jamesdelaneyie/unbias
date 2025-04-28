import { Client, Interpolator } from 'nengi'
import { Application, Container, Graphics } from 'pixi.js';
import TaggedTextPlus from 'pixi-tagged-text-plus'
import { ncontext } from '@/common/ncontext'
import { NType } from '@/common/NType'
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter'

const createNotificationBox = () => {
    const notificationBox = document.createElement('div')
    notificationBox.style.position = 'fixed'
    notificationBox.style.top = '10px'
    notificationBox.style.right = '10px'
    notificationBox.style.width = '300px'
    notificationBox.style.maxHeight = '500px'
    notificationBox.style.overflowY = 'auto'
    notificationBox.style.backgroundColor = 'rgba(0,0,0,0.8)'
    notificationBox.style.color = 'white'
    notificationBox.style.padding = '10px'
    notificationBox.style.borderRadius = '2px'
    notificationBox.style.fontFamily = 'monospace'
    notificationBox.style.fontSize = '10px'
    notificationBox.style.zIndex = '1000'
    document.body.appendChild(notificationBox)
    return notificationBox
}

const addNotification = (box: HTMLDivElement, message: string) => {
    const notification = document.createElement('div')
    notification.textContent = message
    notification.style.borderBottom = '1px solid rgba(255,255,255,0.2)'
    notification.style.padding = '5px 0'
    box.appendChild(notification)
    box.scrollTop = box.scrollHeight
}

const createPlayer = (entity: any, app: Application) => {
    const player = new Graphics()
        .circle(0, 0, 10)
        .fill({ color: entity.color, alpha: 1 })
    player.x = entity.x
    player.y = entity.y
    app.stage.addChild(player)
}


window.addEventListener('load', async () => {

    // initialize the pixi app
    const app = new Application()
    await app.init({ 
        antialias: true,
        background: '#000000', 
        resolution: window.devicePixelRatio,
        autoDensity: true,
        resizeTo: window,
    });
    document.body.appendChild(app.canvas);

    const masterContainer = new Container()
    app.stage.addChild(masterContainer)

    const pageTitleText = 'BIAS 2'
    const pageTitle = new TaggedTextPlus(pageTitleText, {
        default: {
            fontSize: "24px",
            fill: "#fff",
            align: "left",
        },
    })
    pageTitle.x = 10
    pageTitle.y = 10
    masterContainer.addChild(pageTitle)

    let connected = false
    const serverTickRatePerSecond = 20
    const client = new Client(ncontext, WebSocketClientAdapter, serverTickRatePerSecond)
    
    // Reconnection settings
    const MAX_RECONNECT_ATTEMPTS = 5
    const RECONNECT_DELAY = 2000 // 2 seconds
    let reconnectAttempts = 0
    let reconnectTimeout: number | null = null

    const attemptReconnect = async () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            addNotification(notificationBox, 'Max reconnection attempts reached')
            return
        }

        reconnectAttempts++
        addNotification(notificationBox, `Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)

        try {
            const res = await client.connect('ws://localhost:9001', { token: 12345 })
            if (res === 'accepted') {
                addNotification(notificationBox, 'Reconnected to server')
                connected = true
                reconnectAttempts = 0
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout)
                    reconnectTimeout = null
                }
            } else {
                console.log(res)
                addNotification(notificationBox, 'Reconnection failed: ' + res)
                scheduleReconnect()
            }
        } catch (err) {
            console.log('empty err', err)
            addNotification(notificationBox, 'Reconnection error')
            scheduleReconnect()
        }
    }

    const scheduleReconnect = () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
        }
        reconnectTimeout = window.setTimeout(attemptReconnect, RECONNECT_DELAY)
    }

    client.setDisconnectHandler((reason: any, event: any) => {
        console.warn('Disconnected custom!', reason, event)
        addNotification(notificationBox, 'Disconnected from server')
        connected = false
        scheduleReconnect()
    })
    const interpolator = new Interpolator(client)

    const notificationBox = createNotificationBox()
    addNotification(notificationBox, 'Window loaded')

    let sendCommand = false
    setTimeout(() => {
        sendCommand = true
    }, 2000)
   
    try {
        const res = await client.connect('ws://localhost:9001', { token: 12345 })
        if(res==='accepted') {
            addNotification(notificationBox, 'Connected to server')
            connected = true
        } else {
            console.log(res)
            addNotification(notificationBox, 'Connection error: ' + res)
        }
    } catch (err) {
        console.log(err)
        addNotification(notificationBox, 'Connection error: ' + err)
        return
    }

    const tick = (delta: number) => {
        // Only proceed if client is connected
        if (!connected) {
            return;
        }

        const istate = interpolator.getInterpolatedState(100)

        while (client.network.messages.length > 0) {
            const message = client.network.messages.pop()
            console.log('Received message:', message)
        }

        istate.forEach(snapshot => {
            snapshot.createEntities.forEach((entity: any) => {
                console.log('createEntities', entity)
                createPlayer(entity, app)

                // TODO create new entity on the client
            })

            snapshot.updateEntities.forEach((diff: any) => {
                console.log('updateEntities', diff)
                // TODO update existing entity
            })

            snapshot.deleteEntities.forEach((nid: number) => {
                console.log('deleteEntities', nid)
                // TODO remove existing entity
            })
        })

        if(sendCommand) {
            addNotification(notificationBox, 'Sending command')
            client.addCommand({ ntype: NType.Command, w: true, a: true, s: true, d: true, delta })
            console.log('Sending command')
            sendCommand = false
        }

        try {
            client.flush()
        } catch {
            // Ignore flush errors when disconnected
            console.log('Flush failed - likely disconnected')
        }
    }

    // a standard rAF loop
    let prev = performance.now()
    const loop = () => {
        window.requestAnimationFrame(loop)
        const now = performance.now()
        const delta = (now - prev) / 1000
        prev = now
        // probably missing "if (connected)..."
        tick(delta)
    }

    // start the loop
    loop()
})