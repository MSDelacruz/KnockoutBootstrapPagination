﻿module App {
    "use strict";

    export class ClinViewModel {
        totalAwardedAmountAndReimbursed: KnockoutObservable<number>;
        $slinModal: JQuery;
        clin: KnockoutObservable<Clin>;
        clinRemaining: KnockoutComputed<number>;
        validClin: KnockoutComputed<boolean>;
        clins: KnockoutObservableArray<any>;
        slin: KnockoutObservable<Slin>;
        editedClin: KnockoutObservable<Clin>;
        availableCategories: KnockoutObservableArray<Category>;
        updateClinAmount: (clin: Clin) => void;
        updateClinPercent: (clin: Clin) => void;
        addClin: () => void;
        removeClin: (clin: Clin) => void;
        updateClin: (clin: Clin) => void;
        toggleClinEditMode: (clin: Clin) => void;
        undoClinChanges: (clin: Clin) => void;
        addSlinToClin: () => void;
        openSlinEditorModal: (clin: Clin) => void;
        updateSlinAmount: () => void;
        updateSlinPercent: () => void;
        removeSlinToClin: (clin: Clin, slin: Slin) => void;

        validSlin: (slin: Slin) => boolean;
        visibleAddSlin: (clin: Clin) => boolean;        
        validUpdateClin: (clin: Clin) => boolean;
        
        constructor(private svc: IClinService, fakeTotalAmount: number) {
            var self = this;

            self.$slinModal = $("#slinModal");
            self.totalAwardedAmountAndReimbursed = ko.observable(fakeTotalAmount);
            self.clin = ko.observable(new Clin());
            self.clins = ko.observableArray([]);
            self.slin = ko.observable(new Slin());
            self.editedClin = ko.observable(new Clin());
            self.clinRemaining = ko.computed(calculateRemaining, self);
            self.updateClinAmount = updateClinAmount;
            self.updateClinPercent = updateClinPercent;
            self.validClin = ko.computed(validClin, self);
            self.addClin = addClin;
            self.removeClin = removeClin;
self.updateClin = updateClin;
            self.toggleClinEditMode = toggleClinEditMode;
            self.undoClinChanges = undoClinChanges;
            self.addSlinToClin = addSlinToClin;
            self.openSlinEditorModal = openSlinEditorModal;
            self.updateSlinAmount = updateSlinAmount;
            self.updateSlinPercent = updateSlinPercent;
            self.availableCategories = ko.observableArray([]);
            self.validSlin = validSlin;
            self.validUpdateClin = validUpdateClin;
            self.visibleAddSlin = visibleAddSlin;
            self.removeSlinToClin = removeSlinToClin;
            var editIndex = -1;
            var previousAmount = 0;
            
            function calculateRemaining(): number {
                var self: ClinViewModel = this;
                if (self.clins().length === 0) {
                    return self.totalAwardedAmountAndReimbursed();
                }
                var amounts = 0;
                $.each(self.clins(), (idx: number, elm: Clin): void => {
                    if (elm !== self.clin()) {
                        amounts += parseFloat(elm.clinAmount().toString());
                    }
                });

                var remaining = self.totalAwardedAmountAndReimbursed() - amounts;
                return remaining >= 0 ? remaining : 0;
            }

            function updateClinAmount(vm: any): void {
                var clin = vm;
                if (typeof vm.clin === "function") {
                    clin = vm.clin();
                }

                watchChanges(clin);
                var amount = self.totalAwardedAmountAndReimbursed() * (clin.clinPercentage() / 100);
                clin.clinAmount(amount);
            }

            function updateClinPercent(vm: any): void {
                var clin = vm;
                if (typeof vm.clin === "function") {
                    clin = vm.clin();
                }

                watchChanges(clin);
                var percent = (clin.clinAmount() * 100) / self.totalAwardedAmountAndReimbursed();
                clin.clinPercentage(percent);
            }

            function watchChanges(clin: Clin): void {
                (<any>clin.clinAmount).subscribeChanged(function (latestValue, previousValue) {
                    previousAmount = previousValue;
                });
            }

            function validClin(): boolean {
                return validUpdateClin(self.clin());
            }

            function addClin(): void {
                var clinItem = JSON.parse(ko.toJSON(self.clin()));
                saveClinItem(clinItem);

                function saveClinItem(clinItem: IClin) {
                    var request = self.svc.addSingleEntry(clinItem);
                    request.done(refreshList);
                    request.fail(errorHandler);

                    function refreshList(clin: IClin): void {
                        self.clins.push(ko.mapping.fromJS(clin));
                        self.clin(new Clin());
                        toastr.success("Done inserting", "AddClin");
                    }
                }
            }            

            function removeClin(clin: Clin): void {
                var clinItem = JSON.parse(ko.toJSON(clin));
                var request = self.svc.removeSingleEntry(clinItem);
                request.done(refreshList);
                request.fail(errorHandler);

                function refreshList(): void {
                    self.clins.remove(clin);
                    self.clin(new Clin());
                    toastr.success("Done removing", "removeClin");
                }
            }

            function updateClin(clin: Clin): void {
                var clinItem = JSON.parse(ko.toJSON(clin));
                var request = self.svc.updateSingleEntry(clinItem);
                request.done(refreshList);
                request.fail(errorHandler);

                function refreshList(): void {
                    toggleClinEditMode(clin);
                    self.clin(new Clin());
                    toastr.success("Done updating", "removeClin");
                }
            }

            function toggleClinEditMode(clin: Clin): void {
                self.editedClin(clin);
                var currMode = !clin.editMode();
                clin.editMode(currMode);
            }

            function undoClinChanges(clin: Clin): void {
                clin.clinId(self.editedClin().clinId());
                clin.clinAmount(previousAmount);

                var percent = (self.editedClin().clinAmount() * 100) / self.totalAwardedAmountAndReimbursed();
                clin.clinPercentage(percent);
                clin.editMode(false);
            }

            
            function addSlinToClin(): void {
                self.editedClin().slins.push(self.slin());
                var clinItem = JSON.parse(ko.toJSON(self.editedClin));
                updateClinItem(clinItem);
            }

            function removeSlinToClin(clin, slin): void {
                clin.slins.remove(slin);
                updateClinItem(ko.mapping.toJS(clin));
            }

            function updateClinItem(clinItem: IClin): void {
                var request = svc.updateSingleEntry(clinItem);
                request.done(refreshList);
                request.fail(errorHandler);

                function refreshList(clin: IClin): void {
                    var arr = self.clins();

                    arr[editIndex] = ko.mapping.fromJS(clin);
                    self.clins(arr);
                    self.slin(new Slin(arr[editIndex]));
                    self.$slinModal.modal("hide");
                    toastr.info("Done updating, new SLIN added", "updateClinItem");
                }
            }

            function openSlinEditorModal(clin: Clin): void {
                var request = svc.getAvailableCategories();

                request.done(populateModal);                
                request.fail(errorHandler);

                function populateModal(categories: Category[]): void {                    
                    self.availableCategories([]);
                    $.each(categories, (idx: number, elm: Category): void => {
                        var cat = JSON.parse(ko.toJSON(elm));
                        self.availableCategories.push(cat);
                    });
                    toastr.info("Done refreshing categories", "openSlinEditorModal");
                    editIndex = self.clins.indexOf(clin);
                    self.editedClin(clin);
                    self.$slinModal.modal("show");
                }
            }

            function updateSlinAmount(): void {
                var slin = self.slin();
                var amount = self.editedClin().clinAmount() * (slin.slinPercent() / 100);
                slin.slinAmount(amount);
            }

            function updateSlinPercent(): void {
                var slin = self.slin();
                var percent = (slin.slinAmount() * 100) / self.editedClin().clinAmount();
                slin.slinPercent(percent);
            }

            function validUpdateClin(clin: Clin): boolean {
                return !!clin.clinId && clin.clinId().length > 0 &&
                    !!clin.clinAmount &&
                    parseFloat(clin.clinAmount().toString()) > 0 &&
                    (self.clinRemaining() - parseFloat(clin.clinAmount().toString())) >= 0
            }

            function validSlin(): boolean {
                var clin = self.editedClin();

                var amount = clin.clinAmount() -
                    self.slin().slinAmount();
                $.each(clin.slins(), (idx: number, elm: Slin): void => {
                    amount -= parseFloat(elm.slinAmount().toString());
                });

                return !!self.slin() &&
                    !!self.slin().category() &&
                    self.slin().category().id() > 0 &&
                    self.slin().slinAmount() > 0 &&
                    amount >= 0;
            }

            function visibleAddSlin(clin: Clin): boolean {
                var amount = clin.clinAmount();
                $.each(clin.slins(), (idx: number, elm: Slin): void => {
                    amount -= parseFloat(elm.slinAmount().toString());
                });

                return amount > 0;
            }

            function errorHandler(): void {
                toastr.error("Could not insert CLIN item");
            }
        }
    }
}
