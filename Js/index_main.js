let profileData = null;
let assetBasePath = "./Assets";
let actionStatusTimeout = null;

function resolveAssetPath(path) {
    if (!path) {
        return "";
    }

    if (/^(https?:)?\/\//.test(path) || path.startsWith("./") || path.startsWith("../")) {
        return path;
    }

    return `${assetBasePath}/${path}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

async function loadData() {
    try {
        const response = await fetch("./data.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Unable to load data.json");
        }
        profileData = await response.json();
    } catch (error) {
        const fallbackNode = document.getElementById("profile-data-fallback");
        if (!fallbackNode) {
            throw error;
        }
        profileData = JSON.parse(fallbackNode.textContent);
    }

    assetBasePath = profileData.assetBasePath || "./Assets";
}

function createContactItem(iconPath, label, href) {
    const item = document.createElement("a");
    item.className = "contact-item";
    item.href = href || "#";

    const icon = document.createElement("img");
    icon.className = "contact-icon";
    icon.src = resolveAssetPath(iconPath);
    icon.alt = "";

    const text = document.createElement("span");
    text.className = "contact-text";
    text.textContent = label || "";

    item.append(icon, text);
    return item;
}

function populateLinks(containerId, items, itemClassName) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = "";

    (items || []).forEach((item) => {
        if (!item?.href || !item?.icon) {
            return;
        }

        const link = document.createElement("a");
        link.className = itemClassName;
        link.href = item.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.setAttribute("aria-label", item.label || "");

        const icon = document.createElement("img");
        icon.src = resolveAssetPath(item.icon);
        icon.alt = item.label || "";

        link.appendChild(icon);
        container.appendChild(link);
    });
}

function populateServices(items) {
    const list = document.getElementById("service-list");
    if (!list) {
        return;
    }

    list.innerHTML = "";

    (items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
    });
}

function setImage(id, path, alt = "") {
    const node = document.getElementById(id);
    if (!node || !path) {
        return;
    }

    node.src = resolveAssetPath(path);
    node.alt = alt;
}

function setLink(id, href, text) {
    const node = document.getElementById(id);
    if (!node) {
        return;
    }

    if (href) {
        node.href = href;
    }

    if (typeof text === "string") {
        node.textContent = text;
    }
}

function setActionStatus(message) {
    const statusNode = document.getElementById("action-status");
    if (!statusNode) {
        return;
    }

    statusNode.textContent = "";

    if (actionStatusTimeout) {
        clearTimeout(actionStatusTimeout);
    }

    actionStatusTimeout = window.setTimeout(() => {
        statusNode.textContent = message;
    }, 20);
}

async function fetchContactFile() {
    if (!profileData?.vcardFile) {
        return null;
    }

    const fileUrl = resolveAssetPath(profileData.vcardFile);
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error("Unable to load contact file");
    }

    const blob = await response.blob();
    return new File([blob], "Suresh-Thirunavukkarasu.vcf", {
        type: blob.type || "text/vcard"
    });
}

function triggerDownload(href, filename) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function downloadBlob(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    triggerDownload(blobUrl, filename);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function saveContactCard() {
    if (!profileData?.vcardFile) {
        throw new Error("Contact file not available");
    }

    triggerDownload(resolveAssetPath(profileData.vcardFile), "Suresh-Thirunavukkarasu.vcf");
    setActionStatus("Contact file downloaded.");
}

async function shareProfileCard() {
    const shareUrl = profileData?.website?.href || profileData?.shareHref || window.location.href;
    const shareData = {
        title: profileData?.pageTitle || "Profile Card",
        text: `${profileData?.officeName || profileData?.profession || "Profile"}${profileData?.officePhone?.label ? ` • ${profileData.officePhone.label}` : ""}`,
        url: shareUrl
    };

    if (navigator.share) {
        await navigator.share(shareData);
        return;
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setActionStatus("Profile link copied.");
        return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
}

async function exchangeContactCard() {
    const fallbackHref = profileData?.exchangeContactHref || profileData?.email?.href || profileData?.website?.href;
    const shareUrl = profileData?.website?.href || window.location.href;
    const shareText = `${profileData?.officeName || "Profile"}${profileData?.officePhone?.label ? ` • ${profileData.officePhone.label}` : ""}`;

    if (navigator.share) {
        try {
            const contactFile = await fetchContactFile();
            if (contactFile && navigator.canShare?.({ files: [contactFile] })) {
                await navigator.share({
                    title: profileData?.pageTitle || "Contact Card",
                    text: shareText,
                    files: [contactFile],
                    url: shareUrl
                });
                return;
            }

            await navigator.share({
                title: profileData?.pageTitle || "Contact Card",
                text: shareText,
                url: shareUrl
            });
            return;
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }
        }
    }

    if (fallbackHref) {
        window.location.href = fallbackHref;
        return;
    }

    await saveContactCard();
}

function bindActionButtons() {
    const shareButton = document.getElementById("share-link");
    if (shareButton) {
        shareButton.addEventListener("click", async () => {
            try {
                await shareProfileCard();
            } catch (error) {
                console.error(error);
                setActionStatus("Unable to share profile right now.");
            }
        });
    }

    const exchangeButton = document.getElementById("exchange-contact-link");
    if (exchangeButton) {
        exchangeButton.addEventListener("click", async () => {
            try {
                await exchangeContactCard();
            } catch (error) {
                console.error(error);
                setActionStatus("Unable to exchange contact right now.");
            }
        });
    }

    const saveButton = document.getElementById("save-contact-link");
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            try {
                await saveContactCard();
            } catch (error) {
                console.error(error);
                setActionStatus("Unable to download contact file.");
            }
        });
    }
}

function populateCard() {
    const data = profileData;

    document.title = data.pageTitle || document.title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && data.pageDescription) {
        metaDescription.setAttribute("content", data.pageDescription);
    }

    const faviconLink = document.getElementById("favicon-link");
    if (faviconLink && data.favicon) {
        faviconLink.href = resolveAssetPath(data.favicon);
    }

    setImage("banner-image", data.bannerImage, "Law office banner");
    setImage("profile-image", data.profilePhoto, "Suresh Thirunavukkarasu portrait");
    setImage("law-icon", data.lawIcon, "");
    setImage("powered-by-text-image", "PowerbyTxt.svg", "Powered by");
    setImage("powered-by-lawmines-image", "PoweredbyLawMines.svg", "Lawmines");
    setImage("powered-by-good-image", "PoweredbyGoodUX.svg", "Good");

    const nameNode = document.getElementById("name-html");
    if (nameNode) {
        nameNode.innerHTML = data.nameHtml || "";
    }

    const degreeNode = document.getElementById("degree-text");
    if (degreeNode) {
        degreeNode.textContent = data.degree || "";
    }

    const professionNode = document.getElementById("profession-text");
    if (professionNode) {
        professionNode.textContent = data.profession || "";
    }

    const practiceNode = document.getElementById("practice-area-text");
    if (practiceNode) {
        practiceNode.textContent = (data.practiceArea || "").toUpperCase();
    }

    const summaryNode = document.getElementById("summary-text");
    if (summaryNode) {
        summaryNode.textContent = data.summary || "";
    }

    const contactList = document.getElementById("contact-list");
    if (contactList) {
        contactList.innerHTML = "";

        (data.phones || []).forEach((phone) => {
            contactList.appendChild(createContactItem("phone_icon.svg", phone.label, phone.href));
        });

        if (data.email?.label) {
            contactList.appendChild(createContactItem("email_icon.svg", data.email.label, data.email.href));
        }
    }

    populateLinks("top-socials", data.topSocials, "social-icon-link");
    populateLinks("bottom-socials", data.bottomSocials, "bottom-social-link");
    populateServices(data.services);

    const officeNameNode = document.getElementById("office-name-text");
    if (officeNameNode) {
        officeNameNode.textContent = data.officeName || "";
    }

    const officeAddressNode = document.getElementById("office-address-html");
    if (officeAddressNode) {
        officeAddressNode.innerHTML = data.officeAddressHtml || "";
    }

    setLink("office-phone-link", data.officePhone?.href, data.officePhone?.label || "");
    setLink("office-email-link", data.officeEmail?.href, data.officeEmail?.label || "");
    setLink("map-link", data.mapLink);
    setLink("website-link", data.website?.href, data.website?.label || "");
    setLink("powered-by-link", data.website?.href);

    const downloadProfileButton = document.getElementById("download-profile-button");
    if (downloadProfileButton) {
        downloadProfileButton.addEventListener("click", () => {
            window.print();
        });
    }
}

async function main() {
    await loadData();
    populateCard();
    bindActionButtons();
}

main().catch((error) => {
    console.error(error);
});
