;(() => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches
    const isTouch = window.matchMedia("(pointer: coarse)").matches

    const year = document.getElementById("year")
    if (year) year.textContent = String(new Date().getFullYear())

    const themeToggle = document.getElementById("landing-theme-toggle")
    const applyTheme = (theme) => {
        const isLight = theme === "light"
        document.body.classList.toggle("light-mode", isLight)
        localStorage.setItem("theme", theme)
        if (!themeToggle) return
        themeToggle.querySelector("span").textContent = isLight ? "☾" : "☀"
        const nextTheme = isLight ? "dark" : "light"
        themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`)
        themeToggle.title = `Switch to ${nextTheme} mode`
    }
    if (themeToggle) {
        applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light")
        themeToggle.addEventListener("click", () => applyTheme(document.body.classList.contains("light-mode") ? "dark" : "light"))
    }

    const particlesRoot = document.getElementById("particles")
    if (particlesRoot && !reduceMotion && !isTouch) {
        const count = Math.min(18, Math.floor(window.innerWidth / 95))
        for (let i = 0; i < count; i += 1) {
            const particle = document.createElement("span")
            particle.className = "particle"
            particle.style.left = `${Math.random() * 100}%`
            particle.style.top = `${Math.random() * 100}%`
            particle.style.setProperty("--dur", `${10 + Math.random() * 10}s`)
            particle.style.setProperty("--delay", `${-Math.random() * 8}s`)
            particlesRoot.appendChild(particle)
        }
    }

    const revealEls = document.querySelectorAll(".reveal")
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add("in-view")
            })
        },
        { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    )
    revealEls.forEach((el) => io.observe(el))

    const tiltCards = document.querySelectorAll(".tilt-card")
    const tiltMax = isTouch ? 0 : window.innerWidth < 900 ? 5 : 8

    const setTilt = (card, clientX, clientY) => {
        const rect = card.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        const px = x / rect.width
        const py = y / rect.height
        const rx = (0.5 - py) * tiltMax
        const ry = (px - 0.5) * tiltMax
        card.style.setProperty("--rx", `${rx}deg`)
        card.style.setProperty("--ry", `${ry}deg`)
        card.style.setProperty("--mx", `${px * 100}%`)
        card.style.setProperty("--my", `${py * 100}%`)
    }

    tiltCards.forEach((card) => {
        if (!reduceMotion && !isTouch) {
            card.addEventListener("pointermove", (event) =>
                setTilt(card, event.clientX, event.clientY)
            )
        }
        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--rx", "0deg")
            card.style.setProperty("--ry", "0deg")
            card.style.setProperty("--mx", "50%")
            card.style.setProperty("--my", "50%")
        })
        card.addEventListener("focusin", () => {
            card.style.setProperty("--rx", "0deg")
            card.style.setProperty("--ry", "0deg")
            card.style.setProperty("--mx", "50%")
            card.style.setProperty("--my", "50%")
        })
    })
})()