import { Component, ViewEncapsulation, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgImageSliderComponent } from '@coderpradp/ng-image-slider';
import { HeroService } from './hero.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, NgImageSliderComponent],
})
export class AppComponent {
  private heroService = inject(HeroService);

  readonly ds = viewChild<NgImageSliderComponent>('nav');
  title = 'Ng Image Slider';
  showSlider = true;

  sliderWidth = 940;
  sliderImageWidth = 250;
  sliderImageHeight = 200;
  sliderArrowShow = true;
  sliderInfinite = false;
  sliderImagePopup = true;
  sliderAutoSlide = false;
  sliderSlideImage = 1;
  sliderAnimationSpeed = 1;
  imageObject;
  fallbackImageObject;
  slideOrderType = 'DESC';

  constructor() {
    this.setImageObject();
  }

  onChangeHandler() {
    this.setImageObject();
    this.showSlider = false;
    setTimeout(() => {
      this.showSlider = true;
    }, 10);
  }

  setImageObject() {
    // this.heroService.getImages().subscribe((data: any) => {
    // setTimeout(() => {
    //     this.imageObject = data;
    // }, 3000);
    // });
    this.imageObject = this.heroService.getImagesWithOrder();
    this.fallbackImageObject = this.heroService.getFallbackImages();
  }

  imageOnClick(index) {
    console.log('index', index);
  }

  lightboxClose() {
    console.log('lightbox close');
  }

  arrowOnClick(event) {
    console.log('arrow click event', event);
  }

  lightboxArrowClick(event) {
    console.log('popup arrow click', event);
  }

  prevImageClick() {
    this.ds().prev();
  }

  nextImageClick() {
    this.ds().next();
  }
}
