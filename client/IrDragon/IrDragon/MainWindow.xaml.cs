using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace IrDragon
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        
        public MainWindow()
        {
            InitializeComponent();
        }

        private void Window_KeyDown(object sender, KeyEventArgs e)
        {
            
            if (e.Key == Key.Space && Keyboard.IsKeyDown(Key.LeftCtrl))
            {
                if (RectCover.Visibility == Visibility.Visible)
                {
                    RectCover.Visibility = Visibility.Hidden;
                }
                else
                {
                    RectCover.Visibility = Visibility.Visible;
                }
                e.Handled = true;
            }
            else if (e.Key == Key.Escape)
            {
                WindowState = WindowState.Minimized;
                e.Handled = true;
            }
        }

        private void Window_StateChanged(object sender, EventArgs e)
        {
            if (WindowState == WindowState.Minimized && RectCover.Visibility == Visibility.Hidden)
            {
                RectCover.Visibility = Visibility.Visible;
            }
        }
    }
}
