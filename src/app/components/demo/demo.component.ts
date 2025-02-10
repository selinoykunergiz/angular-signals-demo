import {
  Component,
  ChangeDetectorRef,
  signal,
  computed,
  effect,
  linkedSignal,
  resource,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
  imports: [CommonModule],
})
export class DemoComponent {
  // --- Ürün Listesi ---
  // Statik demo verisi: Ürünlerin id, ad ve fiyat bilgileri
  products: Product[] = [
    { id: 1, name: 'Ürün A', price: 25 },
    { id: 2, name: 'Ürün B', price: 40 },
    { id: 3, name: 'Ürün C', price: 35 },
  ];
  isSending = signal<boolean>(false);

  // --- Sepet İşlemleri ---
  // cartItems sinyali, alışveriş sepetindeki ürünleri ve adetlerini tutar.
  cartItems = signal<CartItem[]>([]);

  isLoadingNewCart = computed(
    () =>
      this.orderResource.isLoading() &&
      !this.isSending() &&
      this.totalItems() > 0
  );

  // totalItems: Sepetteki toplam ürün sayısını hesaplar.
  totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  // cartTotal: Sepetin toplam fiyatını hesaplar.
  cartTotal = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
  );

  // discount: Sepet toplamı belirli bir eşiği (100 TL) aştığında %10 indirim uygular.
  discount = computed(() => {
    const total = this.cartTotal();
    return total >= 100 ? total * 0.1 : 0;
  });

  // discountedTotal: İndirim uygulandıktan sonraki ödenecek toplam tutarı hesaplar.
  discountedTotal = computed(() => this.cartTotal() - this.discount());

  // effect(): Sepet toplamı 100 TL’ye ulaştığında, konsola bildirim yapar.
  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      if (this.cartTotal() >= 100) {
        console.log('Tebrikler! Sepetinizde indirim uygulanıyor.');
      }
    });
  }

  // Ürün ekleme: Eğer ürün zaten sepette varsa, adetini artırır; yoksa yeni ekler.
  addToCart(product: Product) {
    this.cartItems.update((items) => {
      const existingItem = items.find((item) => item.product.id === product.id);
      if (existingItem) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  // updateQuantity(): Sepetteki belirli bir ürünün adetini günceller.
  updateQuantity(productId: number, newQuantity: number) {
    if (newQuantity < 1) return;
    this.cartItems.update((items) =>
      items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }

  // removeFromCart(): Sepetten belirli bir ürünü kaldırır.
  removeFromCart(productId: number) {
    this.cartItems.update((items) =>
      items.filter((item) => item.product.id !== productId)
    );
  }

  // clearCart(): Sepeti temizler.
  clearCart() {
    this.cartItems.set([]);
  }

  // --- Teslimat Seçenekleri ---
  // shippingOptions: Teslimat seçeneklerini içeren sinyal.
  shippingOptions = signal(['Kara', 'Hava', 'Deniz']);
  // linkedSignal kullanılarak, varsayılan teslimat seçeneği otomatik olarak belirlenir.
  selectedOption = linkedSignal(() => this.shippingOptions()[0]);

  changeShipping(index: number) {
    this.selectedOption.set(this.shippingOptions()[index]);
  }

  // --- Sipariş Gönderimi (resource()) ---
  // orderResource: Sipariş gönderimi için asenkron veri yükleme simülasyonu.
  orderResource = resource({
    // request fonksiyonu: Sepet verilerindeki değişikliklere bağlı olarak tetiklenir.
    request: () => ({ items: this.cartItems() }),
    // loader fonksiyonu: API çağrısı simülasyonu; gecikme eklenerek gerçek dünya API deneyimi taklit edilir.
    loader: async ({ request, abortSignal }) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.isSending.set(false);
      return { success: true, orderId: Math.floor(Math.random() * 10000) };
    },
  });

  // Siparişi gönderme: orderResource tetiklenir ve başarılı ise sepet temizlenir.
  submitOrder() {
    try {
      // Siparişi gönderme sürecinin başladığını belirtmek için isSending'i true yapıyoruz
      this.isSending.set(true);

      // Siparişi gönderiyoruz, bu işlem async olduğu için await ile bekliyoruz
      const result = this.orderResource.value();

      // Sipariş başarılı ise sepeti temizliyoruz
      console.log('Sipariş gönderildi:', result);
      this.clearCart();
    } catch (error) {
      // Hata durumunda bir mesaj gösterebiliriz
      console.error('Sipariş gönderilirken hata oluştu:', error);
    }
  }
}
