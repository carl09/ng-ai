import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorPickerComponent', () => {
    let colorPickerComponent: ColorPickerComponent;
    let fixture: ComponentFixture<ColorPickerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ColorPickerComponent],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ColorPickerComponent);
        colorPickerComponent = fixture.componentInstance;

        fixture.detectChanges();

        // var pasteEvent = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'My string' } );
    });

    describe('type color', () => {
        it('valid color', () => {
            let selectedColor: string;
            colorPickerComponent.change.subscribe(c => (selectedColor = c));

            const nameInput = fixture.debugElement.query(By.css('input'));

            nameInput.nativeElement.value = '#cccccc';
            nameInput.triggerEventHandler('keyup', { target: nameInput.nativeElement });

            fixture.detectChanges();

            expect(selectedColor).toBe('#cccccc');
        });

        it('valid color without #', () => {
            let selectedColor: string;
            colorPickerComponent.change.subscribe(c => (selectedColor = c));

            const nameInput = fixture.debugElement.query(By.css('input'));

            nameInput.nativeElement.value = 'cccccc';
            nameInput.triggerEventHandler('keyup', { target: nameInput.nativeElement });

            fixture.detectChanges();

            expect(selectedColor).toBe('#cccccc');
        });

        it('valid color shortform ccc', () => {
            let selectedColor: string;
            colorPickerComponent.change.subscribe(c => (selectedColor = c));

            const nameInput = fixture.debugElement.query(By.css('input'));

            nameInput.nativeElement.value = 'ccc';
            nameInput.triggerEventHandler('keyup', { target: nameInput.nativeElement });

            fixture.detectChanges();

            expect(selectedColor).toBe('#cccccc');
        });
    });
});
