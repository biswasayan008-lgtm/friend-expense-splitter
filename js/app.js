/* =========================================================
   FAIRSplit - APP ENGINE
   Step 3: Main JavaScript
   ========================================================= */

"use strict";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {

    group: {
        name: "My Trip",
        date: "",
        description: ""
    },

    members: [],

    expenses: [],

    editingExpenseId: null,

    pendingConfirmAction: null

};


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "fairsplit_group_v1";


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

}


function loadData() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return;
    }

    try {

        const parsed = JSON.parse(saved);

        state.group = parsed.group || state.group;
        state.members = parsed.members || [];
        state.expenses = parsed.expenses || [];

    } catch (error) {

        console.error(
            "Unable to load saved data:",
            error
        );

    }

}


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);


const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    loadData();

    bindEvents();

    renderEverything();

}


/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindEvents() {


    /* ---------------------------------------------
       Navigation
    --------------------------------------------- */

    $$(".nav-btn").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                switchSection(
                    button.dataset.section
                );

            }
        );

    });


    /* ---------------------------------------------
       Member buttons
    --------------------------------------------- */

    $("#addMemberBtn")
        ?.addEventListener(
            "click",
            () => openModal("memberModal")
        );


    $("#addFirstMemberBtn")
        ?.addEventListener(
            "click",
            () => openModal("memberModal")
        );


    $("#memberForm")
        ?.addEventListener(
            "submit",
            handleMemberSubmit
        );


    /* ---------------------------------------------
       Expense
    --------------------------------------------- */

    $("#addExpenseBtn")
        ?.addEventListener(
            "click",
            () => openExpenseModal()
        );


    $("#expenseForm")
        ?.addEventListener(
            "submit",
            handleExpenseSubmit
        );


    /* ---------------------------------------------
       Group
    --------------------------------------------- */

    $("#editGroupBtn")
        ?.addEventListener(
            "click",
            openGroupModal
        );


    $("#groupForm")
        ?.addEventListener(
            "submit",
            handleGroupSubmit
        );


    /* ---------------------------------------------
       Split method
    --------------------------------------------- */

    $$('input[name="splitMethod"]')
        .forEach(radio => {

            radio.addEventListener(
                "change",
                handleSplitMethodChange
            );

        });


    /* ---------------------------------------------
       Select all participants
    --------------------------------------------- */

    $("#selectAllParticipants")
        ?.addEventListener(
            "click",
            selectAllParticipants
        );


    /* ---------------------------------------------
       Export
    --------------------------------------------- */

    $("#exportCsvBtn")
        ?.addEventListener(
            "click",
            exportCSV
        );


    $("#printReportBtn")
        ?.addEventListener(
            "click",
            () => window.print()
        );


    /* ---------------------------------------------
       Confirmation
    --------------------------------------------- */

    $("#confirmActionBtn")
        ?.addEventListener(
            "click",
            executeConfirmedAction
        );


    /* ---------------------------------------------
       Close modals
    --------------------------------------------- */

    $$("[data-close]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.close
                    );

                }
            );

        });


    $$(".modal-overlay")
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                () => {

                    const modal =
                        overlay.closest(".modal");

                    if (modal) {
                        closeModal(modal.id);
                    }

                }
            );

        });


    /* ---------------------------------------------
       Escape key
    --------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            $$(".modal:not(.hidden)")
                .forEach(modal => {

                    closeModal(modal.id);

                });

        }
    );

}


/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function switchSection(sectionName) {

    $$(".nav-btn").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );

    });


    $$(".page-section").forEach(section => {

        section.classList.remove("active");

    });


    const target =
        $(`#${sectionName}Section`);

    if (target) {
        target.classList.add("active");
    }

}


/* =========================================================
   MODALS
   ========================================================= */

function openModal(id) {

    const modal = $(`#${id}`);

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModal(id) {

    const modal = $(`#${id}`);

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   GROUP
   ========================================================= */

function openGroupModal() {

    $("#groupName").value =
        state.group.name || "";

    $("#groupDate").value =
        state.group.date || "";

    $("#groupDescription").value =
        state.group.description || "";

    openModal("groupModal");

}


function handleGroupSubmit(event) {

    event.preventDefault();

    state.group.name =
        $("#groupName").value.trim()
        || "My Trip";

    state.group.date =
        $("#groupDate").value;

    state.group.description =
        $("#groupDescription").value.trim();

    saveData();

    renderEverything();

    closeModal("groupModal");

    showToast(
        "Group details saved"
    );

}


/* =========================================================
   MEMBERS
   ========================================================= */

function handleMemberSubmit(event) {

    event.preventDefault();

    const input =
        $("#memberName");

    const name =
        input.value.trim();

    if (!name) {
        showToast(
            "Please enter a name",
            "error"
        );
        return;
    }


    const exists =
        state.members.some(
            member =>
                member.name.toLowerCase()
                === name.toLowerCase()
        );


    if (exists) {

        showToast(
            "This member already exists",
            "error"
        );

        return;

    }


    const member = {

        id: createId("member"),

        name: name,

        createdAt:
            new Date().toISOString()

    };


    state.members.push(member);

    saveData();

    input.value = "";

    closeModal("memberModal");

    renderEverything();

    showToast(
        `${name} added to the group`
    );

}


/* =========================================================
   MEMBER RENDERING
   ========================================================= */

function renderMembers() {

    const container =
        $("#memberList");

    $("#memberCount").textContent =
        state.members.length;

    $("#summaryMembers").textContent =
        state.members.length;


    if (!state.members.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">👥</div>

                <h3>No members</h3>

                <p>
                    Add friends who are participating
                    in this group.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.members
            .map(member => {

                const initials =
                    getInitials(member.name);

                const paid =
                    getMemberPaid(member.id);

                return `

                    <div
                        class="member-card"
                        data-member-id="${member.id}">

                        <div class="member-card-left">

                            <div class="avatar">
                                ${escapeHTML(initials)}
                            </div>

                            <div>

                                <div class="member-name">
                                    ${escapeHTML(member.name)}
                                </div>

                                <small>
                                    Paid ₹${formatMoney(paid)}
                                </small>

                            </div>

                        </div>


                        <div class="member-actions">

                            <button
                                class="small-icon-btn"
                                title="Delete member"
                                type="button"
                                onclick="requestDeleteMember('${member.id}')">

                                🗑️

                            </button>

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   DELETE MEMBER
   ========================================================= */

function requestDeleteMember(memberId) {

    const member =
        findMember(memberId);

    if (!member) {
        return;
    }


    const used =
        state.expenses.some(
            expense =>
                expense.paidBy === memberId
                ||
                expense.participants
                    .some(
                        p =>
                            p.memberId === memberId
                    )
        );


    if (used) {

        showToast(
            "Cannot delete a member already used in expenses",
            "error"
        );

        return;

    }


    openConfirm(
        "Delete Member?",
        `Remove ${member.name} from this group?`,
        () => {

            state.members =
                state.members.filter(
                    m => m.id !== memberId
                );

            saveData();

            renderEverything();

            showToast(
                `${member.name} removed`
            );

        }
    );

}


/* =========================================================
   EXPENSE MODAL
   ========================================================= */

function openExpenseModal(expenseId = null) {

    state.editingExpenseId =
        expenseId;


    resetExpenseForm();


    if (expenseId) {

        const expense =
            state.expenses.find(
                e => e.id === expenseId
            );

        if (!expense) {
            return;
        }

        $("#expenseDescription").value =
            expense.description;

        $("#expenseCategory").value =
            expense.category;

        $("#expenseAmount").value =
            expense.amount;

        $("#expensePaidBy").value =
            expense.paidBy;

        $("#expenseNotes").value =
            expense.notes || "";


        const method =
            expense.splitMethod || "equal";

        const radio =
            document.querySelector(
                `input[name="splitMethod"][value="${method}"]`
            );

        if (radio) {
            radio.checked = true;
        }

    }


    populatePaidBy();

    populateParticipants(
        expenseId
    );


    handleSplitMethodChange();


    openModal("expenseModal");

}


/* =========================================================
   RESET EXPENSE FORM
   ========================================================= */

function resetExpenseForm() {

    $("#expenseForm").reset();

    state.editingExpenseId = null;

    $("#customSplitContainer")
        .classList.add("hidden");

}


/* =========================================================
   PAID BY
   ========================================================= */

function populatePaidBy() {

    const select =
        $("#expensePaidBy");

    if (!select) {
        return;
    }


    const current =
        select.value;


    select.innerHTML = `

        <option value="">
            Select who paid
        </option>

        ${state.members.map(member => `

            <option value="${member.id}">
                ${escapeHTML(member.name)}
            </option>

        `).join("")}

    `;


    if (
        current
        &&
        state.members.some(
            m => m.id === current
        )
    ) {

        select.value = current;

    }

}


/* =========================================================
   PARTICIPANTS
   ========================================================= */

function populateParticipants(expenseId = null) {

    const container =
        $("#participantList");

    if (!container) {
        return;
    }


    if (!state.members.length) {

        container.innerHTML = `

            <p class="helper-text">
                Add members first.
            </p>

        `;

        return;

    }


    let selectedIds =
        state.members.map(
            member => member.id
        );


    if (expenseId) {

        const expense =
            state.expenses.find(
                e => e.id === expenseId
            );

        if (expense) {

            selectedIds =
                expense.participants
                    .map(
                        participant =>
                            participant.memberId
                    );

        }

    }


    container.innerHTML =
        state.members.map(member => {

            const selected =
                selectedIds.includes(member.id);


            return `

                <label
                    class="participant-item
                    ${selected ? "selected" : ""}">

                    <input
                        type="checkbox"
                        value="${member.id}"
                        ${selected ? "checked" : ""}>

                    <span>
                        ${escapeHTML(member.name)}
                    </span>

                </label>

            `;

        }).join("");


    container
        .querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    input
                        .closest(".participant-item")
                        .classList.toggle(
                            "selected",
                            input.checked
                        );

                    if (
                        getSplitMethod()
                        === "custom"
                    ) {

                        renderCustomSplit();

                    }

                }
            );

        });

}


/* =========================================================
   SELECT ALL
   ========================================================= */

function selectAllParticipants() {

    const checkboxes =
        document.querySelectorAll(
            "#participantList input[type='checkbox']"
        );


    const allSelected =
        Array.from(checkboxes)
            .every(
                checkbox =>
                    checkbox.checked
            );


    checkboxes.forEach(checkbox => {

        checkbox.checked =
            !allSelected;

        checkbox
            .closest(".participant-item")
            ?.classList.toggle(
                "selected",
                checkbox.checked
            );

    });


    if (
        getSplitMethod()
        === "custom"
    ) {

        renderCustomSplit();

    }

}


/* =========================================================
   SPLIT METHOD
   ========================================================= */

function getSplitMethod() {

    const selected =
        document.querySelector(
            'input[name="splitMethod"]:checked'
        );

    return selected
        ? selected.value
        : "equal";

}


function handleSplitMethodChange() {

    const method =
        getSplitMethod();

    const custom =
        $("#customSplitContainer");


    if (method === "custom") {

        custom.classList.remove(
            "hidden"
        );

        renderCustomSplit();

    } else {

        custom.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   CUSTOM SPLIT
   ========================================================= */

function renderCustomSplit() {

    const container =
        $("#customSplitList");

    const participants =
        getSelectedParticipantIds();


    if (!participants.length) {

        container.innerHTML = `

            <p class="helper-text">
                Select participants first.
            </p>

        `;

        updateCustomSplitTotal();

        return;

    }


    const expense =
        state.editingExpenseId
            ? state.expenses.find(
                e =>
                    e.id ===
                    state.editingExpenseId
            )
            : null;


    container.innerHTML =
        participants.map(memberId => {

            const member =
                findMember(memberId);

            let amount = "";


            if (expense) {

                const existing =
                    expense.participants.find(
                        p =>
                            p.memberId ===
                            memberId
                    );

                if (existing) {
                    amount =
                        existing.share;
                }

            }


            return `

                <div class="custom-split-row">

                    <span>
                        ${escapeHTML(
                            member?.name || ""
                        )}
                    </span>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        data-custom-member="${memberId}"
                        value="${amount}"
                        placeholder="₹ 0">

                </div>

            `;

        }).join("");


    container
        .querySelectorAll(
            "input[data-custom-member]"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                updateCustomSplitTotal
            );

        });


    updateCustomSplitTotal();

}


function updateCustomSplitTotal() {

    const inputs =
        document.querySelectorAll(
            "input[data-custom-member]"
        );


    let total = 0;


    inputs.forEach(input => {

        total +=
            toNumber(input.value);

    });


    $("#customSplitTotal").textContent =
        `₹${formatMoney(total)}`;

}


/* =========================================================
   GET SELECTED PARTICIPANTS
   ========================================================= */

function getSelectedParticipantIds() {

    return Array.from(
        document.querySelectorAll(
            "#participantList input[type='checkbox']:checked"
        )
    ).map(
        input => input.value
    );

}


/* =========================================================
   ADD / EDIT EXPENSE
   ========================================================= */

function handleExpenseSubmit(event) {

    event.preventDefault();


    if (!state.members.length) {

        showToast(
            "Add members first",
            "error"
        );

        return;

    }


    const description =
        $("#expenseDescription")
            .value
            .trim();


    const category =
        $("#expenseCategory").value;


    const amount =
        toNumber(
            $("#expenseAmount").value
        );


    const paidBy =
        $("#expensePaidBy").value;


    const notes =
        $("#expenseNotes")
            .value
            .trim();


    const splitMethod =
        getSplitMethod();


    const participantIds =
        getSelectedParticipantIds();


    /* ---------------------------------------------
       Validation
    --------------------------------------------- */

    if (!description) {

        showToast(
            "Enter an expense name",
            "error"
        );

        return;

    }


    if (!category) {

        showToast(
            "Select an expense category",
            "error"
        );

        return;

    }


    if (amount <= 0) {

        showToast(
            "Enter a valid amount",
            "error"
        );

        return;

    }


    if (!paidBy) {

        showToast(
            "Select who paid",
            "error"
        );

        return;

    }


    if (!participantIds.length) {

        showToast(
            "Select at least one participant",
            "error"
        );

        return;

    }


    let participants = [];


    /* ---------------------------------------------
       Equal split
    --------------------------------------------- */

    if (splitMethod === "equal") {

        const shares =
            splitAmountEqually(
                amount,
                participantIds.length
            );


        participants =
            participantIds.map(
                (memberId, index) => ({

                    memberId,

                    share:
                        shares[index]

                })
            );

    }


    /* ---------------------------------------------
       Custom split
    --------------------------------------------- */

    else {

        const inputs =
            document.querySelectorAll(
                "input[data-custom-member]"
            );


        let customTotal = 0;


        inputs.forEach(input => {

            customTotal +=
                toNumber(input.value);

        });


        if (
            !approximatelyEqual(
                customTotal,
                amount
            )
        ) {

            showToast(
                `Custom split must equal ₹${formatMoney(amount)}`,
                "error"
            );

            return;

        }


        participants =
            Array.from(inputs)
                .map(input => ({

                    memberId:
                        input.dataset.customMember,

                    share:
                        roundMoney(
                            toNumber(input.value)
                        )

                }));

    }


    /* ---------------------------------------------
       Create expense object
    --------------------------------------------- */

    const expenseData = {

        description,

        category,

        amount:
            roundMoney(amount),

        paidBy,

        participants,

        splitMethod,

        notes

    };


    /* ---------------------------------------------
       Edit existing expense
    --------------------------------------------- */

    if (state.editingExpenseId) {

        const index =
            state.expenses.findIndex(
                e =>
                    e.id ===
                    state.editingExpenseId
            );


        if (index !== -1) {

            state.expenses[index] = {

                ...state.expenses[index],

                ...expenseData,

                updatedAt:
                    new Date().toISOString()

            };

            showToast(
                "Expense updated"
            );

        }

    }


    /* ---------------------------------------------
       Add new expense
    --------------------------------------------- */

    else {

        state.expenses.push({

            id:
                createId("expense"),

            ...expenseData,

            createdAt:
                new Date().toISOString()

        });


        showToast(
            "Expense added"
        );

    }


    saveData();

    closeModal("expenseModal");

    renderEverything();

    switchSection("expenses");

}


/* =========================================================
   DELETE EXPENSE
   ========================================================= */

function requestDeleteExpense(expenseId) {

    const expense =
        state.expenses.find(
            e => e.id === expenseId
        );


    if (!expense) {
        return;
    }


    openConfirm(
        "Delete Expense?",
        `Delete "${expense.description}" of ₹${formatMoney(expense.amount)}?`,
        () => {

            state.expenses =
                state.expenses.filter(
                    e =>
                        e.id !== expenseId
                );

            saveData();

            renderEverything();

            showToast(
                "Expense deleted"
            );

        }
    );

}


/* =========================================================
   EXPENSE RENDERING
   ========================================================= */

function renderExpenses() {

    const container =
        $("#expenseList");


    $("#expenseCount").textContent =
        state.expenses.length;


    if (!state.expenses.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">🧾</div>

                <h3>No expenses yet</h3>

                <p>
                    Add your first group expense.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        [...state.expenses]
            .reverse()
            .map(expense => {

                const payer =
                    findMember(
                        expense.paidBy
                    );


                return `

                    <div class="expense-card">

                        <div class="expense-icon">
                            ${getCategoryIcon(
                                expense.category
                            )}
                        </div>


                        <div class="expense-main">

                            <h3>
                                ${escapeHTML(
                                    expense.description
                                )}
                            </h3>

                            <p>
                                Paid by
                                <strong>
                                    ${escapeHTML(
                                        payer?.name
                                        || "Unknown"
                                    )}
                                </strong>
                            </p>

                            <span class="expense-category">
                                ${escapeHTML(
                                    expense.category
                                )}
                            </span>

                        </div>


                        <div class="expense-right">

                            <div class="expense-amount">
                                ₹${formatMoney(
                                    expense.amount
                                )}
                            </div>

                            <small>
                                ${expense.participants.length}
                                participant(s)
                            </small>


                            <div class="expense-actions">

                                <button
                                    class="small-icon-btn"
                                    type="button"
                                    title="Edit"
                                    onclick="openExpenseModal('${expense.id}')">

                                    ✏️

                                </button>


                                <button
                                    class="small-icon-btn"
                                    type="button"
                                    title="Delete"
                                    onclick="requestDeleteExpense('${expense.id}')">

                                    🗑️

                                </button>

                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   CALCULATIONS
   ========================================================= */


/*
    IMPORTANT:

    For every member:

    Actual Paid
           -
    Fair Share
           =
    Net Balance

    Positive = receives money
    Negative = pays money
*/


function calculateBalances() {

    const balances = {};


    state.members.forEach(member => {

        balances[member.id] = {

            memberId:
                member.id,

            name:
                member.name,

            paid: 0,

            share: 0,

            balance: 0

        };

    });


    state.expenses.forEach(expense => {

        /* Amount actually paid */

        if (balances[expense.paidBy]) {

            balances[
                expense.paidBy
            ].paid +=
                expense.amount;

        }


        /* Individual share */

        expense.participants.forEach(
            participant => {

                if (
                    balances[
                        participant.memberId
                    ]
                ) {

                    balances[
                        participant.memberId
                    ].share +=
                        participant.share;

                }

            }
        );

    });


    Object.values(balances)
        .forEach(balance => {

            balance.paid =
                roundMoney(balance.paid);

            balance.share =
                roundMoney(balance.share);

            balance.balance =
                roundMoney(
                    balance.paid
                    -
                    balance.share
                );

        });


    return Object.values(balances);

}


/* =========================================================
   EQUAL SPLIT
   ========================================================= */

function splitAmountEqually(
    amount,
    people
) {

    if (people <= 0) {
        return [];
    }


    const totalPaise =
        Math.round(
            amount * 100
        );


    const base =
        Math.floor(
            totalPaise / people
        );


    const remainder =
        totalPaise % people;


    const shares = [];


    for (
        let i = 0;
        i < people;
        i++
    ) {

        const paise =
            base +
            (i < remainder ? 1 : 0);


        shares.push(
            paise / 100
        );

    }


    return shares;

}


/* =========================================================
   SETTLEMENT CALCULATOR
   ========================================================= */


/*
    This algorithm matches people who need to pay
    with people who need to receive.

    It tries to minimize the number of transactions.
*/


function calculateSettlement() {

    const balances =
        calculateBalances();


    const creditors =
        balances
            .filter(
                person =>
                    person.balance > 0.009
            )
            .map(
                person => ({
                    ...person,
                    amount:
                        person.balance
                })
            );


    const debtors =
        balances
            .filter(
                person =>
                    person.balance < -0.009
            )
            .map(
                person => ({
                    ...person,
                    amount:
                        Math.abs(
                            person.balance
                        )
                })
            );


    const settlements = [];


    let i = 0;
    let j = 0;


    while (
        i < debtors.length
        &&
        j < creditors.length
    ) {

        const debtor =
            debtors[i];

        const creditor =
            creditors[j];


        const amount =
            Math.min(
                debtor.amount,
                creditor.amount
            );


        if (amount > 0.009) {

            settlements.push({

                from:
                    debtor.memberId,

                fromName:
                    debtor.name,

                to:
                    creditor.memberId,

                toName:
                    creditor.name,

                amount:
                    roundMoney(amount)

            });

        }


        debtor.amount =
            roundMoney(
                debtor.amount - amount
            );


        creditor.amount =
            roundMoney(
                creditor.amount - amount
            );


        if (
            debtor.amount
            <=
            0.009
        ) {

            i++;

        }


        if (
            creditor.amount
            <=
            0.009
        ) {

            j++;

        }

    }


    return settlements;

}


/* =========================================================
   RENDER BALANCES
   ========================================================= */

function renderBalances() {

    const container =
        $("#balanceContainer");


    const balances =
        calculateBalances();


    if (!balances.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">👥</div>

                <h3>No members yet</h3>

                <p>
                    Add your friends to start
                    splitting expenses.
                </p>

                <button
                    id="addFirstMemberBtn"
                    class="primary-btn"
                    type="button">

                    + Add Member

                </button>

            </div>

        `;


        $("#addFirstMemberBtn")
            ?.addEventListener(
                "click",
                () => openModal("memberModal")
            );

        return;

    }


    container.innerHTML =
        balances.map(balance => {

            const isReceive =
                balance.balance > 0.009;

            const isPay =
                balance.balance < -0.009;


            let status =
                "Settled";

            if (isReceive) {
                status = "Gets back";
            }

            if (isPay) {
                status = "Needs to pay";
            }


            const amount =
                Math.abs(
                    balance.balance
                );


            return `

                <div
                    class="balance-card
                    ${isReceive ? "receive" : ""}
                    ${isPay ? "pay" : ""}">

                    <div class="balance-top">

                        <div class="person-info">

                            <div class="avatar">
                                ${escapeHTML(
                                    getInitials(
                                        balance.name
                                    )
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        balance.name
                                    )}
                                </strong>

                                <small>
                                    ${status}
                                </small>

                            </div>

                        </div>


                        <div
                            class="balance-value
                            ${isReceive
                                ? "receive"
                                : ""
                            }
                            ${isPay
                                ? "pay"
                                : ""
                            }">

                            ${
                                isReceive
                                    ? "+"
                                    : isPay
                                        ? "-"
                                        : ""
                            }
                            ₹${formatMoney(amount)}

                        </div>

                    </div>


                    <div class="balance-details">

                        <div class="balance-detail">

                            <small>
                                Actually Paid
                            </small>

                            <strong>
                                ₹${formatMoney(
                                    balance.paid
                                )}
                            </strong>

                        </div>


                        <div class="balance-detail">

                            <small>
                                Fair Share
                            </small>

                            <strong>
                                ₹${formatMoney(
                                    balance.share
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            `;

        })
        .join("");

}


/* =========================================================
   SETTLEMENT RENDERING
   ========================================================= */

function renderSettlement() {

    const summary =
        $("#settlementSummary");

    const list =
        $("#settlementList");


    const settlements =
        calculateSettlement();


    if (!state.expenses.length) {

        summary.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">💸</div>

                <h3>No settlement yet</h3>

                <p>
                    Add expenses and the app will
                    calculate who owes whom.
                </p>

            </div>

        `;

        list.innerHTML = "";

        return;

    }


    if (!settlements.length) {

        summary.innerHTML = `

            <div class="settlement-banner">

                <h3>🎉 Everything is settled!</h3>

                <p>
                    Everyone has paid exactly
                    their fair share.
                </p>

            </div>

        `;

        list.innerHTML = "";

        return;

    }


    summary.innerHTML = `

        <div class="settlement-banner">

            <h3>
                ${settlements.length}
                payment${settlements.length === 1 ? "" : "s"}
                needed
            </h3>

            <p>
                These payments will settle the
                group's expenses.
            </p>

        </div>

    `;


    list.innerHTML =
        settlements.map(
            settlement => `

                <div class="settlement-card">

                    <div class="settlement-person">

                        <div class="avatar">
                            ${escapeHTML(
                                getInitials(
                                    settlement.fromName
                                )
                            )}
                        </div>

                        <strong>
                            ${escapeHTML(
                                settlement.fromName
                            )}
                        </strong>

                    </div>


                    <div class="settlement-arrow">
                        →
                    </div>


                    <div class="settlement-person">

                        <div class="avatar">
                            ${escapeHTML(
                                getInitials(
                                    settlement.toName
                                )
                            )}
                        </div>

                        <strong>
                            ${escapeHTML(
                                settlement.toName
                            )}
                        </strong>

                    </div>


                    <div class="settlement-amount">

                        ₹${formatMoney(
                            settlement.amount
                        )}

                    </div>

                </div>

            `
        )
        .join("");

}


/* =========================================================
   CATEGORY REPORT
   ========================================================= */

function renderCategoryReport() {

    const container =
        $("#categorySummary");


    if (!state.expenses.length) {

        container.innerHTML = `

            <div class="empty-state small">
                <p>No expenses recorded.</p>
            </div>

        `;

        return;

    }


    const categories = {};


    state.expenses.forEach(expense => {

        if (
            !categories[
                expense.category
            ]
        ) {

            categories[
                expense.category
            ] = 0;

        }


        categories[
            expense.category
        ] += expense.amount;

    });


    const entries =
        Object.entries(
            categories
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    const max =
        entries.length
            ? entries[0][1]
            : 1;


    container.innerHTML =
        entries.map(
            ([category, amount]) => {

                const percentage =
                    Math.min(
                        100,
                        (amount / max) * 100
                    );


                return `

                    <div class="category-row">

                        <div class="category-name">

                            ${getCategoryIcon(category)}
                            ${escapeHTML(category)}

                        </div>


                        <div class="category-bar">

                            <div
                                class="category-bar-fill"
                                style="width:${percentage}%">
                            </div>

                        </div>


                        <div class="category-value">

                            ₹${formatMoney(amount)}

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


/* =========================================================
   MEMBER REPORT
   ========================================================= */

function renderMemberReport() {

    const container =
        $("#memberReport");


    const balances =
        calculateBalances();


    if (!balances.length) {

        container.innerHTML = `

            <div class="empty-state small">
                <p>No data available.</p>
            </div>

        `;

        return;

    }


    container.innerHTML =
        balances.map(balance => {

            const net =
                balance.balance;


            let netHTML =
                `<span>₹0</span>`;


            if (net > 0.009) {

                netHTML =
                    `<span style="color:var(--green)">
                        +₹${formatMoney(net)}
                    </span>`;

            } else if (net < -0.009) {

                netHTML =
                    `<span style="color:var(--red)">
                        -₹${formatMoney(
                            Math.abs(net)
                        )}
                    </span>`;

            }


            return `

                <div class="member-report-row">

                    <div>

                        <strong>
                            ${escapeHTML(
                                balance.name
                            )}
                        </strong>

                        <small>
                            Member
                        </small>

                    </div>


                    <div>

                        <small>
                            Paid
                        </small>

                        <strong>
                            ₹${formatMoney(
                                balance.paid
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            Share
                        </small>

                        <strong>
                            ₹${formatMoney(
                                balance.share
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            Balance
                        </small>

                        <strong>
                            ${netHTML}
                        </strong>

                    </div>

                </div>

            `;

        })
        .join("");

}


/* =========================================================
   DASHBOARD TOTALS
   ========================================================= */

function renderTotals() {

    const total =
        state.expenses.reduce(
            (sum, expense) =>
                sum + expense.amount,
            0
        );


    const average =
        state.members.length
            ? total /
                state.members.length
            : 0;


    $("#totalExpense").textContent =
        `₹${formatMoney(total)}`;


    $("#summaryTotal").textContent =
        `₹${formatMoney(total)}`;


    $("#averageShare").textContent =
        `₹${formatMoney(average)}`;

}


/* =========================================================
   GROUP HEADER
   ========================================================= */

function renderGroup() {

    $("#groupNameDisplay").textContent =
        state.group.name || "My Trip";

}


/* =========================================================
   EVERYTHING
   ========================================================= */

function renderEverything() {

    renderGroup();

    renderTotals();

    renderMembers();

    renderExpenses();

    renderBalances();

    renderSettlement();

    renderCategoryReport();

    renderMemberReport();

}


/* =========================================================
   CONFIRMATION
   ========================================================= */

function openConfirm(
    title,
    message,
    action
) {

    $("#confirmTitle").textContent =
        title;

    $("#confirmMessage").textContent =
        message;

    state.pendingConfirmAction =
        action;

    openModal("confirmModal");

}


function executeConfirmedAction() {

    const action =
        state.pendingConfirmAction;


    state.pendingConfirmAction =
        null;


    closeModal("confirmModal");


    if (
        typeof action ===
        "function"
    ) {

        action();

    }

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        $("#toast");

    const icon =
        $("#toastIcon");

    const text =
        $("#toastMessage");


    text.textContent =
        message;


    icon.textContent =
        type === "error"
            ? "!"
            : "✓";


    icon.style.color =
        type === "error"
            ? "var(--red)"
            : "var(--green)";


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {

    if (!state.expenses.length) {

        showToast(
            "No expenses to export",
            "error"
        );

        return;

    }


    const rows = [

        [
            "Expense",
            "Category",
            "Amount",
            "Paid By",
            "Participants",
            "Notes",
            "Date"
        ]

    ];


    state.expenses.forEach(
        expense => {

            const payer =
                findMember(
                    expense.paidBy
                );


            const participants =
                expense.participants
                    .map(
                        p =>
                            findMember(
                                p.memberId
                            )?.name
                            || ""
                    )
                    .join(", ");


            rows.push([

                expense.description,

                expense.category,

                expense.amount.toFixed(2),

                payer?.name || "",

                participants,

                expense.notes || "",

                new Date(
                    expense.createdAt
                ).toLocaleString()

            ]);

        }
    );


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            csvEscape
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        `${sanitizeFileName(
            state.group.name
        )}-expenses.csv`;


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "CSV exported"
    );

}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function createId(prefix) {

    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


function findMember(id) {

    return state.members.find(
        member =>
            member.id === id
    );

}


function getMemberPaid(memberId) {

    return roundMoney(
        state.expenses.reduce(
            (sum, expense) => {

                if (
                    expense.paidBy ===
                    memberId
                ) {

                    return (
                        sum +
                        expense.amount
                    );

                }

                return sum;

            },
            0
        )
    );

}


function getInitials(name) {

    if (!name) {
        return "?";
    }


    const parts =
        name
            .trim()
            .split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


function formatMoney(amount) {

    return Number(
        amount || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function roundMoney(amount) {

    return Math.round(
        (Number(amount) + Number.EPSILON)
        * 100
    ) / 100;

}


function toNumber(value) {

    const number =
        parseFloat(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function approximatelyEqual(
    a,
    b
) {

    return (
        Math.abs(
            a - b
        ) < 0.01
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function csvEscape(value) {

    const string =
        String(value ?? "");


    if (
        string.includes(",")
        ||
        string.includes('"')
        ||
        string.includes("\n")
    ) {

        return `"${string.replace(
            /"/g,
            '""'
        )}"`;

    }


    return string;

}


function sanitizeFileName(name) {

    return String(
        name || "group-expenses"
    )
        .replace(
            /[^a-z0-9_\-]+/gi,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        );

}


/* =========================================================
   CATEGORY ICONS
   ========================================================= */

function getCategoryIcon(
    category
) {

    const icons = {

        "Train": "🚆",
        "Flight": "✈️",
        "Bus": "🚌",
        "Cab / Taxi": "🚕",
        "Auto / Rickshaw": "🛺",
        "Car Rental": "🚗",
        "Fuel / Petrol": "⛽",
        "Parking": "🅿️",
        "Toll": "🛣️",
        "Local Transport": "🚎",

        "Hotel": "🏨",
        "Resort": "🏝️",
        "Homestay": "🏠",
        "Room Charges": "🛏️",
        "Extra Bed": "🛏️",
        "Room Service": "🛎️",

        "Breakfast": "🍳",
        "Lunch": "🍱",
        "Dinner": "🍽️",
        "Snacks": "🍿",
        "Tea / Coffee": "☕",
        "Water": "💧",
        "Restaurant": "🍴",
        "Food Delivery": "🛵",

        "Entry Ticket": "🎟️",
        "Sightseeing": "👀",
        "Adventure": "🧗",
        "Boating": "⛵",
        "Amusement Park": "🎢",
        "Movie": "🎬",
        "Event": "🎫",
        "Guide": "🧭",

        "Shopping": "🛍️",
        "Souvenir": "🎁",
        "Gift": "🎁",
        "Personal": "🧴",

        "Medicine": "💊",
        "First Aid": "🩹",
        "Emergency": "🚨",
        "Repair": "🔧",
        "Miscellaneous": "📦",

        "Booking Fee": "📅",
        "Service Charge": "🧾",
        "Convenience Fee": "💳",
        "Tour / Guide Fee": "🧭",
        "Group Fund": "💰",
        "Advance Payment": "💵"

    };


    return (
        icons[category]
        || "💰"
    );

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openExpenseModal =
    openExpenseModal;


window.requestDeleteExpense =
    requestDeleteExpense;


window.requestDeleteMember =
    requestDeleteMember;
