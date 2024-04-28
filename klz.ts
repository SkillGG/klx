// @ts-check

interface Window {
    selectBtns: {
        prev: HTMLButtonElement | null;
        next: HTMLButtonElement | null;
    };
    curReader: Reader | null;
    styleElement: HTMLStyleElement | null;
}

// code to make klmanga w/o ads and other junk
const dialogTimer = 1000;
const bodyClearTimer = 500;
const imgMargin = "5px";
const imageSize = "120vh";

const css = (w?: number, h?: number, l?: number, t?: number) => `
.zones::before {
    content: ".";
    display: block;
    background-color: #f005;
    width: ${(w ?? 0) * 0.3}px;
    left: ${l ?? 0}px;
    top: ${t ?? 0};
    height: ${h ?? 0}px;
    position: absolute;
}
.zones::after {
    content: ".";
    display: block;
    background-color: #0f05;
    width: ${(w ?? 0) * 0.3}px;
    left: ${(l ?? 0) + (w ?? 0) * 0.7}px;
    top: ${t ?? 0};
    height: ${h ?? 0}px;
    position: absolute;
}
`;

const setCSS = ({
    w,
    h,
    l,
    t,
}: {
    w: number;
    h: number;
    l: number;
    t: number;
}) => {
    if (window.styleElement !== null) {
        window.styleElement.innerHTML = css(w, h, l, t);
    }
};

window.selectBtns = { prev: null, next: null };
window.styleElement = null;
window.curReader = null;

const clearBody = () => {
    document.body.setAttribute("class", "");
    document.body.style.cssText = `
        background-image:none !important;
        background-color: #181a1b !important;
        display: flex;
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
        margin: 0;
        padding: 0;
        flex-direction: column;
        `;
};

const resetBody = () => {
    clearBody();
    document.body.innerHTML = "";
    window.styleElement = document.createElement("style");
    window.styleElement.innerHTML = css();
    document.body.append(window.styleElement);
};

const createChapterList = (options: Element[]) => {
    const ChapterSelect = document.createElement("div");
    const newSelect = document.createElement("select");

    options.forEach((opt) => newSelect.append(opt));
    newSelect.selectedIndex = [...newSelect.children].findIndex(
        (o) => o.getAttribute("selected") !== null
    );
    newSelect.addEventListener("change", (ev) => {
        if (ev.target instanceof HTMLSelectElement) {
            window.location.href = ev.target.value;
        }
    });

    // create chapter select
    document.body.append(ChapterSelect);
    ChapterSelect.style.position = "fixed";
    ChapterSelect.style.top = "20%";
    ChapterSelect.style.left = "10px";
    const prevBtn = document.createElement("button");
    prevBtn.id = "moveleft";
    prevBtn.innerText = "Prev";
    prevBtn.onclick = (e) => {
        newSelect.selectedIndex--;
        newSelect.dispatchEvent(new Event("change"));
    };
    const nextBtn = document.createElement("button");
    nextBtn.id = "moveright";
    nextBtn.innerText = "Next";
    nextBtn.onclick = (e) => {
        newSelect.selectedIndex++;
        newSelect.dispatchEvent(new Event("change"));
    };
    window.selectBtns.next = nextBtn;
    window.selectBtns.prev = prevBtn;
    if (newSelect.selectedIndex > 0) ChapterSelect.append(prevBtn);
    ChapterSelect.append(newSelect);
    if (newSelect.selectedIndex < newSelect.children.length - 1)
        ChapterSelect.append(nextBtn);
    ChapterSelect.append(document.createElement("br"));
    ChapterSelect.append("Press D to show full page after refresh!");

    const ltrSwitch = document.createElement("label");
    ltrSwitch.style.cssText = `
        cursor: pointer;
        color: white;
    `;
    const ltrLabel = document.createElement("span");
    ltrLabel.innerText = "Left To Right";
    const ltrCheckbox = document.createElement("input");
    ltrCheckbox.type = "checkbox";
    ltrCheckbox.checked = true;
    ltrCheckbox.style.display = "none";
    ltrSwitch.append(ltrLabel, ltrCheckbox);
    ltrCheckbox.onchange = () => {
        if (ltrCheckbox.checked) {
            ltrLabel.innerText = "Left To Right";
            if (window.curReader !== null) {
                window.curReader.rtl = false;
            }
        } else {
            ltrLabel.innerText = "Right To Left";
            if (window.curReader !== null) {
                window.curReader.rtl = true;
            }
        }
    };
    ChapterSelect.append(document.createElement("br"), ltrSwitch);

    return [ChapterSelect];
};

const createTitleElement = (name: string, num: string) => {
    const title = document.createElement("div");
    window.addEventListener("click", () => {
        title.style.display =
            title.style.display === "none" ? "initial" : "none";
        window.curReader?.applyCSS();
    });
    title.style.width = "fit-content";
    title.style.margin = "10px auto 0 auto";
    title.innerHTML = `${name}<br/>${num}`;
    title.style.textAlign = "center";
    title.style.fontSize = "2em";
    document.body.append(title);
};

class Reader {
    parentDiv: HTMLDivElement;
    images: HTMLImageElement[];
    page: number;
    rtl: boolean = false;
    dir() {
        return this.rtl ? 1 : -1;
    }
    constructor(images: HTMLImageElement[]) {
        this.parentDiv = document.createElement("div");
        this.parentDiv.addEventListener("click", this.handleDivClick);
        this.images = images;
        this.page = 0;
        this.createReader();
        setTimeout(() => window.curReader?.applyCSS(), 50);
    }
    handleDivClick = (e: MouseEvent) => {
        if (e.target instanceof HTMLImageElement) {
            e.preventDefault();
            e.stopPropagation();
            const mouseX = e.clientX - e.target.offsetLeft;
            const percent = mouseX / e.target.clientWidth;
            if (percent < 0.3) this.prevPage();
            if (percent > 0.7) this.nextPage();
        }
    };
    applyCSS() {
        const currentImage = this.images[this.page];
        setCSS({
            w: currentImage.clientWidth,
            h: currentImage.clientHeight,
            l: currentImage.offsetLeft,
            t: currentImage.offsetTop,
        });
    }
    createReader() {
        const currentImage = this.images[this.page];
        if (!currentImage) return this.clampPage();
        currentImage.style.cssText = "border: none !important;";
        this.parentDiv.style.cssText = `
            display: flex;
            height: 100%;
            justify-content: center;
            overflow-y:hidden;
            position: relative;
        `;
        this.parentDiv.innerHTML = "";
        this.parentDiv.append(currentImage);
        this.applyCSS();
    }
    nextPage() {
        console.log(this);
        this.page += 1 * this.dir();
        this.createReader();
        this.clampPage();
    }
    prevPage() {
        console.log(this);
        this.page -= 1 * this.dir();
        this.createReader();
        this.clampPage();
    }
    clampPage() {
        if (this.page < 0) {
            this.page = 0;
            console.log("Page is too low!");
            window.selectBtns.prev?.click();
            this.createReader();
        }
        if (this.page >= this.images.length) {
            this.page = this.images.length - 1;
            window.selectBtns.next?.click();
            this.createReader();
        }
    }
    appendTo(el: Element) {
        el.append(this.parentDiv);
    }
}
window.onload = () => {
    if (window.location.hostname.includes("klz9.com")) {
        const devMode = localStorage.getItem("devMode") === "true";
        if (devMode) {
            localStorage.removeItem("devMode");
            return;
        } else {
            // add developer key
            window.addEventListener("keydown", ({ code, shiftKey }) => {
                if (shiftKey && code === "ArrowRight")
                    window.selectBtns.next?.click();
                if (shiftKey && code === "ArrowLeft")
                    window.selectBtns.prev?.click();
                if (code === "ArrowRight") window.curReader?.nextPage();
                if (code === "ArrowLeft") window.curReader?.prevPage();
                if (code === "KeyD") {
                    if (localStorage.getItem("devMode") !== "true") {
                        localStorage.setItem("devMode", "true");
                        const dialog = document.createElement("dialog");
                        dialog.innerHTML =
                            "Dev mode!<br>Next refresh won't remove everything!";
                        dialog.style.position = "fixed";
                        dialog.style.top = "15px";
                        dialog.style.fontSize = "1.5em";
                        dialog.style.margin = "0 auto";
                        document.body.append(dialog);
                        dialog.show();
                        setTimeout(() => dialog.close(), dialogTimer);
                    }
                }
                if (code === "KeyZ") {
                    if (window.curReader !== null) {
                        const div = window.curReader.parentDiv;
                        div.classList.add("zones");
                        setTimeout(() => div.classList.remove("zones"), 500);
                    }
                }
            });
        }
        clearBody();
        setInterval(() => {
            clearBody();
        }, bodyClearTimer);
        const name =
            document.querySelector<HTMLDivElement>(".manga-name")?.innerText ??
            "No-title";
        const chapterNum =
            document.querySelector<HTMLDivElement>(
                "#zlist-chs > select > option[selected]"
            )?.innerText ?? "No-chapternum";
        const images = [
            ...document.querySelectorAll<HTMLImageElement>(
                ".chapter-content p > img"
            ),
        ];
        /** @type {HTMLSelectElement | null} */
        const select = document.querySelector(
            ".chapter-select select.form-control"
        );
        const options = [...(select?.children ?? [])].toReversed();

        if (images.length > 0) {
            resetBody();
            createChapterList(options);
            createTitleElement(name, chapterNum);
            window.curReader = new Reader(images);
            window.curReader.appendTo(document.body);
        }
    }
};
